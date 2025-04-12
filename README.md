# pr-task-mgr
This is a simple task manager webapp. On the client side, it uses the [knockout.js](https://knockoutjs.com/) framework. To demonstrate a fully functional server/client application, I overengineered it to run in a Docker container. This isn't necessary to see the front end, though. There's no ajax/fetch use, and no database. State is stored in the browser's localStorage.

# Building and running
To run with a true server environment, you'll need Docker. On Windows, just run
```
build.bat
```
Then, in your browser, navigate to http://localhost:9000

If you don't have Docker and just want to see the page, go to the `site` folder and double-click index.html.

# Features
* An initial list of tasks is hard coded.
* Tasks can be added.
* Tasks can be deleted.
* Tasks can be edited (subject and status).
* The grid view can be filtered by task status.
* When saving a task, the subject is required.

# Thank you, eComSystems.
This was fun!
