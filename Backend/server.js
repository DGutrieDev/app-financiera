const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})

app.get('/', (req, res) => {
    res.send(`Servidor corriendo en el puerto ${port}`)
})

module.exports = app;