"""Offline pipeline regressions. No real provider calls or credential access."""
from __future__ import annotations

import importlib.util
import json
import os
import sys
from datetime import date, datetime, timezone
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock
import threading
import time

import pytest

SCRIPTS = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPTS))
sys.path.insert(0, str(SCRIPTS / 'social-data'))
from pipeline_utils import atomic_write_json, parse_date, public_strava_activities, sanitize_review_html
import strava_processor as sp
import goodreads_processor as gp
import letterboxd_processor as lp
import orchestrate


def load_module(name, path):
    sys.path.insert(0, str(path.parent))
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


sf = load_module('strava_fetch_test', SCRIPTS / 'strava-fetcher/fetch_activities.py')
gf = load_module('goodreads_fetch_test', SCRIPTS / 'goodreads-fetcher/fetch_books.py')
lf = load_module('letterboxd_fetch_test', SCRIPTS / 'letterboxd-fetcher/fetch_films.py')
opt = load_module('favorites_opt_test', SCRIPTS / 'favorites/optimize_assets.py')
covers = load_module('favorites_covers_test', SCRIPTS / 'favorites/fetch_covers.py')

PUBLIC_ROUTE = '??_ibE_ibE'
OTHER_ROUTE = '??_seK_seK'


def activity(identity=1, **overrides):
    return {'id': identity, 'name': 'Synthetic activity', 'type': 'Ride',
            'start_date': datetime.now(timezone.utc).isoformat(), 'private': False,
            'visibility': 'everyone', 'commute': False, 'distance': 1000, **overrides}


class Response:
    def __init__(self, data=None, status=200, content=b''):
        self.data, self.status_code, self.content = data, status, content
    def json(self):
        return self.data
    def raise_for_status(self):
        if self.status_code != 200:
            raise RuntimeError('Synthetic HTTP error')


@pytest.fixture(autouse=True)
def no_network(monkeypatch):
    def forbidden(*args, **kwargs):
        raise AssertionError('Unexpected network request in offline test')
    monkeypatch.setattr(sf.requests, 'get', forbidden)
    monkeypatch.setattr(sf.requests, 'post', forbidden)
    monkeypatch.setattr(sf, 'load_dotenv', lambda *args: None)
    monkeypatch.delenv('GITHUB_ACTIONS', raising=False)
    monkeypatch.delenv('STRAVA_TOKEN_STATE_WRITE_TOKEN', raising=False)
    monkeypatch.delenv('STRAVA_TOKEN_STATE_ENVIRONMENT', raising=False)
    monkeypatch.setenv('STRAVA_CLIENT_ID', 'fixture-client')
    monkeypatch.setenv('STRAVA_CLIENT_SECRET', 'fixture-secret')
    monkeypatch.setenv('STRAVA_REFRESH_TOKEN', 'fixture-old')


@pytest.fixture
def collector(monkeypatch, tmp_path):
    monkeypatch.setattr(sf, 'REPO_ROOT', tmp_path)
    result = sf.StravaDataCollector()
    result.access_token = 'fixture-access'
    return result


def test_public_projection_retains_public_route_and_omits_private_fields():
    source = [activity(map={'id': 'provider-map-id', 'summary_polyline': PUBLIC_ROUTE,
                           'polyline': OTHER_ROUTE, 'resource_state': 2},
                       start_latlng=[1, 2], description='private detail',
                       average_heartrate=100, athlete={'id': 4}),
              activity(2, visibility='followers_only', map={'summary_polyline': OTHER_ROUTE}),
              activity(3, private=True, visibility='only_me', map={'summary_polyline': OTHER_ROUTE}),
              activity(4, visibility=None, map={'summary_polyline': OTHER_ROUTE}),
              activity(5, private=None, map={'summary_polyline': OTHER_ROUTE})]
    public = public_strava_activities(source)
    assert len(public) == 1
    assert public[0]['map'] == {'summary_polyline': PUBLIC_ROUTE}
    assert not {'start_latlng', 'description', 'average_heartrate', 'athlete'} & public[0].keys()
    assert public_strava_activities(public) == public
    processor = sp.StravaProcessor()
    processor.activities_data = source
    output = processor.get_recent_activities_data()
    assert len(output['all_activities']) == 1
    assert output['all_activities'][0]['map'] == {'summary_polyline': PUBLIC_ROUTE}
    assert output['longest_ride']['id'] == 1
    assert output['longest_ride']['map'] == {'summary_polyline': PUBLIC_ROUTE}
    assert output['stats']['biking']['all_time']['count'] == 1
    assert OTHER_ROUTE not in json.dumps(output)
    assert 'provider-map-id' not in json.dumps(output)
    assert 'private detail' not in json.dumps(output)


@pytest.mark.parametrize('map_data', [
    pytest.param(None, id='null-map'),
    pytest.param([], id='list-map'),
    pytest.param('not-a-map', id='string-map'),
    pytest.param({}, id='missing-polyline'),
    pytest.param({'summary_polyline': None}, id='null-polyline'),
    pytest.param({'summary_polyline': 123}, id='numeric-polyline'),
    pytest.param({'summary_polyline': []}, id='list-polyline'),
    pytest.param({'summary_polyline': ''}, id='empty-polyline'),
    pytest.param({'summary_polyline': 'invalid route'}, id='invalid-characters'),
    pytest.param({'summary_polyline': PUBLIC_ROUTE + '\n'}, id='newline'),
    pytest.param({'summary_polyline': '\u0080'}, id='non-ascii'),
    pytest.param({'summary_polyline': '?' * 200_001}, id='oversized'),
])
def test_bad_maps_leave_public_activity_available_without_route(map_data):
    projected = public_strava_activities([activity(map=map_data)])
    assert len(projected) == 1 and projected[0]['map'] == {}
    assert sp.StravaProcessor().format_activity(projected[0])['map'] == {}


def test_missing_map_and_route_size_boundary():
    assert public_strava_activities([activity()])[0]['map'] == {}
    maximum_route = '??' * 100_000
    assert public_strava_activities([activity(map={'summary_polyline': maximum_route})])[0]['map'] == {'summary_polyline': maximum_route}


def test_short_commute_totals_are_consistent():
    processor = sp.StravaProcessor()
    processor.activities_data = [activity(commute=True)]
    output = processor.get_recent_activities_data()
    assert output['all_activities'] == []
    totals = output['stats']['biking']
    assert totals['all_time'] == totals['ytd'] == totals['recent']
    assert totals['all_time']['count'] == 1


@pytest.mark.parametrize('failure', ['http', 'limit', 'repeat'])
def test_incomplete_strava_fetch_never_replaces_cache(collector, monkeypatch, tmp_path, failure):
    path = tmp_path / 'cache.json'; path.write_text('["old fixture"]')
    responses = ([Response([activity()]), Response(status=500)] if failure == 'http'
                 else [Response([activity()]), Response([activity()])])
    monkeypatch.setattr(sf.requests, 'get', Mock(side_effect=responses))
    with pytest.raises(RuntimeError):
        collector.fetch_activities(max_pages=1 if failure == 'limit' else 3)
    with pytest.raises(RuntimeError, match='incomplete'):
        collector.update_and_save_activities(path)
    assert path.read_text() == '["old fixture"]'


def test_full_strava_refresh_reconciles_deletions_privacy_and_public_route(collector, monkeypatch, tmp_path):
    collector.existing_activities = [activity(1), activity(2), activity(3)]
    batch = [activity(2, visibility='only_me', private=True, map={'summary_polyline': OTHER_ROUTE}),
             activity(3, map={'summary_polyline': PUBLIC_ROUTE, 'id': 'provider-map-id'})]
    monkeypatch.setattr(sf.requests, 'get', Mock(side_effect=[Response(batch), Response([])]))
    collector.fetch_activities()
    path = tmp_path / 'public.json'; collector.update_and_save_activities(path)
    saved = json.loads(path.read_text())
    assert [row['id'] for row in saved] == [3]
    assert saved[0]['map'] == {'summary_polyline': PUBLIC_ROUTE}
    processor = sp.StravaProcessor()
    processor.activities_data = saved
    assert processor.get_recent_activities_data()['all_activities'][0]['map'] == {'summary_polyline': PUBLIC_ROUTE}


def test_incremental_strava_reconciles_window_but_preserves_older(collector, monkeypatch, tmp_path):
    collector.existing_activities = [activity(1, start_date='2000-01-01T00:00:00Z'), activity(2)]
    monkeypatch.setattr(sf.requests, 'get', Mock(return_value=Response([])))
    collector.fetch_activities(fetch_all=False)
    path = tmp_path / 'public.json'; collector.update_and_save_activities(path)
    assert [row['id'] for row in json.loads(path.read_text())] == [1]


def test_unexpected_empty_strava_requires_explicit_confirmation(collector, monkeypatch):
    collector.existing_activities = [activity()]
    monkeypatch.setattr(sf.requests, 'get', Mock(return_value=Response([])))
    with pytest.raises(RuntimeError, match='unexpected empty'):
        collector.fetch_activities()
    collector.fetch_activities(allow_empty=True)
    assert collector.fetch_complete and collector.activities == []


def test_sanitize_cache_is_offline_and_retains_only_public_summary_routes(tmp_path):
    path = tmp_path / 'cache.json'
    source = [activity(map={'summary_polyline': PUBLIC_ROUTE, 'id': 'provider-map-id'}, start_latlng=[1, 2]),
              activity(2, visibility='only_me', map={'summary_polyline': OTHER_ROUTE}),
              activity(3, visibility='followers_only', map={'summary_polyline': OTHER_ROUTE})]
    path.write_text(json.dumps(source))
    sf.sanitize_cache(path)
    data = json.loads(path.read_text())
    assert len(data) == 1 and data[0]['map'] == {'summary_polyline': PUBLIC_ROUTE}
    assert 'start_latlng' not in data[0]
    assert OTHER_ROUTE not in path.read_text()


def test_rotation_is_persisted_privately_and_used_next_time(collector, monkeypatch):
    collector.access_token = None
    post = Mock(side_effect=[Response({'access_token': 'access-one', 'refresh_token': 'rotated-one'}),
                             Response({'access_token': 'access-two', 'refresh_token': 'rotated-two'})])
    monkeypatch.setattr(sf.requests, 'post', post)
    collector.get_access_token(); collector.get_access_token()
    assert post.call_args_list[1].kwargs['data']['refresh_token'] == 'rotated-one'
    state = collector.token_state
    assert json.loads(state.path.read_text()) == {'refresh_token': 'rotated-two'}
    assert state.path.stat().st_mode & 0o777 == 0o600
    assert state.lock_path.stat().st_mode & 0o777 == 0o600
    assert 'access-two' not in state.path.read_text()


def test_ci_requires_configured_writer_before_oauth(collector, monkeypatch):
    collector.token_state.github = True
    post = Mock(); monkeypatch.setattr(sf.requests, 'post', post)
    with pytest.raises(RuntimeError, match='disabled'):
        collector.get_access_token()
    post.assert_not_called()


def test_ci_preflight_failure_precedes_oauth(collector, monkeypatch):
    state = collector.token_state
    state.github = True; state.repository = 'fixture/repo'; state.writer_token = 'writer-fixture'
    state.environment = 'strava-sync'
    token_module = sys.modules[state.__class__.__module__]
    monkeypatch.setattr(token_module.time, 'sleep', lambda _: None)
    run = Mock(side_effect=[SimpleNamespace(returncode=0, stdout='{"name":"STRAVA_REFRESH_TOKEN"}')]
               + [SimpleNamespace(returncode=1)] * 3)
    monkeypatch.setattr(token_module.subprocess, 'run', run)
    post = Mock(); monkeypatch.setattr(sf.requests, 'post', post)
    with pytest.raises(RuntimeError, match='persist'):
        collector.get_access_token()
    post.assert_not_called()
    assert run.call_args.kwargs['input'] == 'ready'
    assert run.call_args.args[0] == ['gh', 'secret', 'set', 'STRAVA_TOKEN_STATE_PROBE', '--repo', 'fixture/repo', '--env', 'strava-sync']
    assert 'fixture-old' not in run.call_args.args[0]


def test_ci_failed_rotation_persistence_blocks_access_token_use(collector, monkeypatch):
    collector.access_token = None
    state = collector.token_state
    state.github = True; state.repository = 'fixture/repo'; state.writer_token = 'writer-fixture'
    state.environment = 'strava-sync'
    monkeypatch.setattr(state, '_require_environment_secret', lambda: None)
    writer = Mock(side_effect=[None, RuntimeError('private writer unavailable')])
    monkeypatch.setattr(state, '_write_github_secret', writer)
    monkeypatch.setattr(sf.requests, 'post', Mock(return_value=Response({'access_token': 'access', 'refresh_token': 'new'})))
    with pytest.raises(RuntimeError, match='unavailable'):
        collector.get_access_token()
    assert collector.access_token is None
    assert json.loads(state.path.read_text())['refresh_token'] == 'new'


@pytest.mark.parametrize('environment', ['', 'other-environment'])
def test_ci_rejects_missing_or_wrong_environment_before_oauth(collector, monkeypatch, environment):
    state = collector.token_state
    state.github = True; state.repository = 'fixture/repo'; state.writer_token = 'writer-fixture'
    state.environment = environment
    post = Mock(); monkeypatch.setattr(sf.requests, 'post', post)
    with pytest.raises(RuntimeError, match='disabled'):
        collector.get_access_token()
    post.assert_not_called()


def test_ci_missing_environment_secret_does_not_use_or_write_stale_repository_fallback(collector, monkeypatch):
    state = collector.token_state
    state.github = True; state.repository = 'fixture/repo'; state.writer_token = 'writer-fixture'
    state.environment = 'strava-sync'
    collector.refresh_token = 'stale-queued-repository-token'
    token_module = sys.modules[state.__class__.__module__]
    run = Mock(return_value=SimpleNamespace(returncode=1, stdout=''))
    monkeypatch.setattr(token_module.subprocess, 'run', run)
    post = Mock(); monkeypatch.setattr(sf.requests, 'post', post)
    with pytest.raises(RuntimeError, match='repository-secret fallback'):
        collector.get_access_token()
    post.assert_not_called()
    assert run.call_count == 1
    assert run.call_args.args[0] == ['gh', 'api', 'repos/fixture/repo/environments/strava-sync/secrets/STRAVA_REFRESH_TOKEN']
    assert 'input' not in run.call_args.kwargs
    assert not state.path.exists()


def test_ci_preflight_never_rolls_back_token_on_failed_exchange(collector, monkeypatch):
    state = collector.token_state
    state.github = True; state.repository = 'fixture/repo'; state.writer_token = 'writer-fixture'
    state.environment = 'strava-sync'
    collector.refresh_token = 'stale-queued-token'
    remote = {'STRAVA_REFRESH_TOKEN': 'new-from-completed-run'}
    token_module = sys.modules[state.__class__.__module__]
    def fake_gh(command, **kwargs):
        if command[1] == 'api':
            return SimpleNamespace(returncode=0, stdout='{"name":"STRAVA_REFRESH_TOKEN"}')
        assert command[-2:] == ['--env', 'strava-sync']
        remote[command[3]] = kwargs['input']
        return SimpleNamespace(returncode=0)
    monkeypatch.setattr(token_module.subprocess, 'run', fake_gh)
    monkeypatch.setattr(sf.requests, 'post', Mock(return_value=Response(status=400)))
    with pytest.raises(RuntimeError, match='HTTP 400'):
        collector.get_access_token()
    assert remote['STRAVA_REFRESH_TOKEN'] == 'new-from-completed-run'
    assert remote['STRAVA_TOKEN_STATE_PROBE'] == 'ready'


def test_ci_job_start_token_rotates_only_in_same_environment(collector, monkeypatch):
    state = collector.token_state
    state.github = True; state.repository = 'fixture/repo'; state.writer_token = 'writer-fixture'
    state.environment = 'strava-sync'
    # GitHub reads environment secrets at job start, after workflow concurrency
    # admits this run. This input models the latest environment snapshot.
    collector.refresh_token = 'latest-from-previous-run'
    remote = {'STRAVA_REFRESH_TOKEN': collector.refresh_token}
    commands = []
    token_module = sys.modules[state.__class__.__module__]
    def fake_gh(command, **kwargs):
        commands.append(command)
        if command[1] == 'api':
            return SimpleNamespace(returncode=0, stdout='{"name":"STRAVA_REFRESH_TOKEN"}')
        assert command[-2:] == ['--env', 'strava-sync']
        remote[command[3]] = kwargs['input']
        return SimpleNamespace(returncode=0)
    monkeypatch.setattr(token_module.subprocess, 'run', fake_gh)
    post = Mock(return_value=Response({'access_token': 'access', 'refresh_token': 'next-rotation'}))
    monkeypatch.setattr(sf.requests, 'post', post)
    collector.get_access_token()
    assert post.call_args.kwargs['data']['refresh_token'] == 'latest-from-previous-run'
    assert remote['STRAVA_REFRESH_TOKEN'] == 'next-rotation'
    assert commands[1][3] == 'STRAVA_TOKEN_STATE_PROBE'
    assert commands[2][3] == 'STRAVA_REFRESH_TOKEN'
    workflow = (SCRIPTS.parent / '.github/workflows/social-data-fetch.yml').read_text()
    assert 'environment: strava-sync' in workflow
    assert 'STRAVA_TOKEN_STATE_ENVIRONMENT: strava-sync' in workflow
    assert 'group: social-data-writer' in workflow
    assert 'cancel-in-progress: false' in workflow


def test_orchestrator_failure_preserves_previous_output(monkeypatch, tmp_path):
    path = tmp_path / 'data.json'; path.write_text('previous good output')
    monkeypatch.setattr(orchestrate, 'OUTPUT_FILE', path)
    monkeypatch.setattr(orchestrate, 'create_letterboxd_processor', Mock(side_effect=ValueError('fixture')))
    with pytest.raises(ValueError):
        orchestrate.main()
    assert path.read_text() == 'previous good output'


def test_atomic_invalid_json_preserves_previous_file(tmp_path):
    path = tmp_path / 'data.json'; path.write_text('previous')
    with pytest.raises(ValueError):
        atomic_write_json(path, {'invalid': float('nan')})
    assert path.read_text() == 'previous'
    assert list(tmp_path.iterdir()) == [path]


def book(identity='1', **overrides):
    return {'book_id': identity, 'title': 'Fixture', 'author_name': 'Author', 'user_rating': 4,
            'user_read_at': 'Mon, 01 Jun 2026 00:00:00 +0000', 'user_review': '', **overrides}


def test_goodreads_full_refresh_removes_absent_books_and_sorts_invalid_last(monkeypatch, tmp_path):
    path = tmp_path / 'books.json'; monkeypatch.setattr(gf, 'DATA_FILE', str(path))
    c = gf.GoodreadsDataCollector(full_refresh=True)
    c.existing_books = [book('removed')]
    c.authoritative = c.fetch_complete = True
    c.fetched_books = [book('bad', user_read_at='invalid'), book('good')]
    c.update_and_save_books()
    saved = json.loads(path.read_text())
    assert [b['book_id'] for b in saved] == ['good', 'bad']
    assert saved[1]['user_read_at'] is None
    monkeypatch.setattr(gp, 'load_books_data', lambda: saved)
    assert len(gp.get_goodreads_data()['all_reviews']) == 1


def test_goodreads_pagination_failure_cannot_save(monkeypatch, tmp_path):
    path = tmp_path / 'books.json'; path.write_text('previous')
    monkeypatch.setattr(gf, 'DATA_FILE', str(path)); monkeypatch.setattr(gf.time, 'sleep', lambda _: None)
    xml = b'<rss><channel><item><book_id>1</book_id><title>Fixture</title></item></channel></rss>'
    monkeypatch.setattr(gf.requests, 'get', Mock(return_value=Response(content=xml)))
    c = gf.GoodreadsDataCollector(full_refresh=True)
    with pytest.raises(ValueError, match='repeated'):
        c.fetch_books()
    with pytest.raises(RuntimeError, match='incomplete'):
        c.update_and_save_books()
    assert path.read_text() == 'previous'


def test_goodreads_shelf_refresh_is_not_full_inventory(monkeypatch, tmp_path):
    path = tmp_path / 'books.json'; monkeypatch.setattr(gf, 'DATA_FILE', str(path))
    c = gf.GoodreadsDataCollector(full_refresh=True, shelf='read')
    c.existing_books = [book('outside-shelf')]
    monkeypatch.setattr(gf.requests, 'get', Mock(return_value=Response(content=b'<rss><channel/></rss>')))
    c.fetch_books(); c.update_and_save_books()
    assert len(json.loads(path.read_text())) == 1


@pytest.mark.parametrize('value', ['Mon, 01 Jun 2026 00:00:00 -0000', '2026-06-01', '2026-06-01T00:00:00Z'])
def test_dates_are_consistent_aware_utc(value):
    assert parse_date(value) == datetime(2026, 6, 1, tzinfo=timezone.utc)


def test_goodreads_diagnostic_has_no_obsolete_key(monkeypatch, capsys):
    monkeypatch.setattr(gp, 'load_books_data', lambda: [])
    gp.main()
    assert 'Total ratings: 0' in capsys.readouterr().out


def test_letterboxd_undated_reviews_are_last(monkeypatch, tmp_path):
    films = [{'guid': 'none', 'title': 'Undated', 'watched_date': None},
             {'guid': 'dated', 'title': 'Dated', 'watched_date': '2026-10-01'}]
    monkeypatch.setattr(lp, 'load_films_data', lambda: films)
    assert lp.LetterboxdProcessor().get_data()['recent_reviews'][0]['title'] == 'Dated'
    path = tmp_path / 'films.json'; monkeypatch.setattr(lf, 'DATA_FILE', str(path))
    c = lf.LetterboxdDataCollector(); c.existing_films = films; c.fetch_complete = True
    c.update_and_save_films()
    assert json.loads(path.read_text())[0]['guid'] == 'dated'


def test_letterboxd_explicit_offline_removal(monkeypatch, tmp_path):
    path = tmp_path / 'films.json'
    path.write_text(json.dumps([{'guid': 'remove', 'review': ''}, {'guid': 'retain', 'review': ''}]))
    monkeypatch.setattr(lf, 'DATA_FILE', str(path))
    monkeypatch.setattr(sys, 'argv', ['fetch_films.py', '--remove-guid', 'remove'])
    lf.main()
    assert [row['guid'] for row in json.loads(path.read_text())] == ['retain']


def test_review_html_is_sanitized_at_both_processor_boundaries():
    payload = '<p onclick="bad()">Text <strong>good</strong><img src=x onerror="bad()"><script>bad()</script><a href="javascript:bad()">bad</a><a href="https://example.com" target="_self">link</a></p>'
    for cleaned in [sanitize_review_html(payload), gp.convert_book_to_review(book(user_review=payload))['review'], lp.convert_film_to_review({'review': payload})['review']]:
        assert '<strong>good</strong>' in cleaned and 'https://example.com' in cleaned
        assert all(bad not in cleaned for bad in ['onclick', 'onerror', '<script', '<img', 'javascript:'])
        assert 'noopener noreferrer' in cleaned


def test_favorite_optimization_survives_metadata_refresh(monkeypatch, tmp_path):
    items = ['https://example.com/book']
    opt.update_favorite_cover(items, items[0], '/images/favorites/books/fixture.jpg')
    config = tmp_path / 'favorites.json'; output = tmp_path / 'metadata.json'
    config.write_text(json.dumps({'films': [], 'books': items}))
    monkeypatch.setattr(covers, 'INPUT_FILE', str(config)); monkeypatch.setattr(covers, 'OUTPUT_FILE', str(output))
    monkeypatch.setattr(covers, 'scrape_book', lambda _: {'title': 'Fixture', 'subtitle': '', 'cover': 'https://example.com/remote.jpg'})
    covers.main()
    assert json.loads(output.read_text())['books'][0]['cover'] == '/images/favorites/books/fixture.jpg'


def test_token_lock_serializes_read_exchange_and_write(collector, monkeypatch):
    # Two collectors share the same private state. The second exchange must see
    # the rotation returned by the first, even when both start together.
    other = sf.StravaDataCollector()
    other.token_state = collector.token_state
    observed = []
    def exchange(*args, **kwargs):
        token = kwargs['data']['refresh_token']
        observed.append(token)
        time.sleep(0.02)
        return Response({'access_token': 'fixture-access', 'refresh_token': token + '-next'})
    monkeypatch.setattr(sf.requests, 'post', exchange)
    failures = []
    def run(item):
        try:
            item.get_access_token()
        except Exception as error:
            failures.append(error)
    threads = [threading.Thread(target=run, args=(item,)) for item in (collector, other)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join(timeout=2)
    assert not failures and all(not thread.is_alive() for thread in threads)
    assert observed == ['fixture-old', 'fixture-old-next']


def test_goodreads_year_boundary_uses_selected_clock(monkeypatch):
    class Year2027(date):
        @classmethod
        def today(cls):
            return cls(2027, 1, 1)
    monkeypatch.setattr(gp, 'date', Year2027)
    assert gp.calculate_stats([book(user_read_at='2026-12-31T23:59:00Z'),
                               book('2', title='Next year', user_read_at='2027-01-01T00:00:00Z')])['books_this_year'] == 1


def test_sanitizer_removes_malformed_urls_without_aborting():
    result = sanitize_review_html('<p><a href="https://[">bad URL</a><a href="data:text/html,bad">data</a>safe</p>')
    assert result == '<p><a>bad URL</a><a>data</a>safe</p>'


def test_orchestrator_invalid_late_source_preserves_previous_output(monkeypatch, tmp_path):
    path = tmp_path / 'data.json'; path.write_text('previous good output')
    valid = {'all_reviews': [], 'recent_reviews': [], 'stats': {}}
    monkeypatch.setattr(orchestrate, 'OUTPUT_FILE', path)
    monkeypatch.setattr(orchestrate, 'create_letterboxd_processor', lambda: SimpleNamespace(get_data=lambda: valid))
    monkeypatch.setattr(orchestrate, 'get_goodreads_data', lambda: valid)
    monkeypatch.setattr(orchestrate, 'StravaProcessor', lambda: SimpleNamespace(get_recent_activities_data=lambda: {}))
    with pytest.raises(ValueError, match='schema'):
        orchestrate.main()
    assert path.read_text() == 'previous good output'


def test_private_atomic_staging_name_is_ignored_pattern(monkeypatch, tmp_path):
    import pipeline_utils
    original_replace = pipeline_utils.os.replace
    observed = []
    def replace(source, destination):
        observed.append(Path(source))
        assert Path(source).name.startswith('.env.')
        assert Path(source).name.endswith('.local')
        assert Path(source).stat().st_mode & 0o777 == 0o600
        original_replace(source, destination)
    monkeypatch.setattr(pipeline_utils.os, 'replace', replace)
    atomic_write_json(tmp_path / '.env.strava-state.local', {'refresh_token': 'fixture'}, mode=0o600)
    assert len(observed) == 1 and not observed[0].exists()
