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

//Greet route handler
const greetController = require("./server/controllers/greetController");
app.use('/upload/images',greetController);

//user route handler
const userController = require("./server/controllers/userController");
app.use("/api/users",userController);

//like component route handler
const likesController = require("./server/controllers/likesController");
app.use('/api/liked',likesController);

//wishlist component route handler
const wishlistController = require("./server/controllers/wishlistController");
app.use('/api/wishlist',wishlistController);

//festive component route handler
const festiveController = require("./server/controllers/festiveController");
app.use("/api/festives",festiveController);
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("Database connection successful."))
    .catch((e) => console.error(e.message))


    app.listen(process.env.PORT, () => console.log(`server is running at port ${process.env.PORT}`));
