const express = require("express");
const app = express();

app.use(express.static('site'))

const port = 3000;
app.listen(port, () => console.log(`App listening to port ${port}`));