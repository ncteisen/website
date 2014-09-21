send_all:
	scp -r * ncteisen@login.engin.umich.edu:~/Public/html

send:
	scp $(file) ncteisen@login.engin.umich.edu:~/Public/html
