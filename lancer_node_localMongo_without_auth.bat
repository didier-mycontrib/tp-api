set PORT=8233
REM  MONGODB_URL=mongodb://127.0.0.1:27017
set MONGODB_HOSTNAME=127.0.0.1
set MONGODB_PORT=27017
REM set MONGODB_USERNAME=root
REM set MONGODB_PASSWORD=root
REM set MONGODB_PASSWORD_FILE=my_temp_secret_pwd.txt
REM node server.js

REM WITHOUT_AUTH!=yes by default
set WITHOUT_AUTH=yes
REM WITH_SANDBOXREALM!=yes by default

nodemon server.js
pause