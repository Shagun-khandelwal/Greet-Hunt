const express = require('express');
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
fsProm = require( "fs/promises" )
const mongoose = require('mongoose');
require('dotenv').config({ path: "./config.env" })

app.use(cors())
app.use(bodyParser.json());


app.get("/",(req,res)=>{
    res.status(200).json({
        success:true,
        message:"main get request working properly."
    })
});

const greetController = require("./server/controllers/greetController");
app.use('/upload/images',greetController);

const userController = require("./server/controllers/userController");
app.use("/api/users",userController);


mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("Database connection successful."))
    .catch((e) => console.error(e.message))


    app.listen(process.env.PORT, () => console.log(`sever is running at port ${process.env.PORT}`));
