docker build -t prtaskmanager .
docker run -d --name prtasks -p 9000:3000 -it prtaskmanager
