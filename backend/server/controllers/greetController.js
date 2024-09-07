const express = require("express");
const router = express.Router();
const multer = require('multer');
const Aws = require("aws-sdk");
require('aws-sdk/lib/maintenance_mode_message').suppress = true;
// the above line5 is wriiten in order to supress the warning
const Greets = require("../models/greetSchema");
require("dotenv").config({ path: "../../config.env" });
const {festive,style, colour} = require("../randomft");



const storage = multer.memoryStorage({
    destination: function (req, file, cb) {
        cb(null, '')
    }
});

const correctmimetype = {
    'image/jpeg':"jpeg",
    'image/jpg':"jpeg",
    'application/octet-stream':"jfif",
    'image/png':"png"

}
const filefilter = (req, file, cb) => {
    console.log(file)
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg' || file.mimetype === 'image/png' || file.mimetype === 'application/octet-stream' || file.mimetype === 'image/jif' || file.mimetype === 'image/jpe' || file.mimetype === 'image/gif') {
        cb(null, true)
    } else {
        cb(null, false)
    }
}

const upload = multer({ storage: storage, fileFilter: filefilter });

const s3 = new Aws.S3({
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,              // accessKeyId that is stored in .env file
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,       // secretAccessKey is also store in .env file
    },
    region: process.env.REGION
});

// Get request to find the images related to particular festive,style and colour.
router.get("/query", async (req, res) => {

    const images = await Greets.find({
        festive: req.query.festive
    });

    // if error in retreive images
    if (!images) res.status(404).send(`Images related to ${req.params.festive} is not uploaded yet.`);
    
    let urlArray = [];
    // if (req.query.tags) {
    //     let querytags = req.query.tags.split(",")        
    //     images.map(image=>{
    //         image.tags.map(img_tag=>{
    //             if(querytags.includes(img_tag)){
    //                 urlArray.push(image.greet_image)
    //             }
    //         })
    //         urlArray = [...new Set(urlArray)];
    //         return;
    //     })
    // }
    if(req.query.style && req.query.colour){
        images.map(element => {
            if(element.style === req.query.style && element.colour === req.query.colour){
                urlArray.push(element);
            }
            return;
        })
    }
    else if(req.query.style){
        images.map(element => {
            if(element.style === req.query.style){
                urlArray.push(element);
            }
            return;
        })
    }
    else if(req.query.colour){
        images.map(element => {
            if(element.colour === req.query.colour){
                urlArray.push(element);
            }
            return;
        })
    }
    else {
        images.map(element => {
            urlArray.push(element);
            return;
        })
    }
    res.status(200).json({
        success: true,
        item_count: urlArray.length,
        data: urlArray
    });
})

//get all images 
router.get("/", async (req, res) => {
    const images = await Greets.find();
    if (!images) res.status(404).send("Error in fetching images.");

    const urlArray = [];
    images.map(element => {
        urlArray.push(element);
        return;
    })
    res.status(200).json({
        success: true,
        count: urlArray.length,
        data: urlArray
    });
});

//get an image with particular id
router.get("/:id",async (req,res)=>{
    const image = await Greets.findById(req.params.id);
    if (!image) res.status(404).send("Error in fetching image.");
    
    res.status(200).json({
        success: true,
        data: image
    });
})

//post a single image 
router.post("/", upload.single('greetimage'), async (req, res, next) => {
    let buffer = req.file.buffer;
    if(req.file.mimetype === 'application/octet-stream'){
        buffer  = Buffer.from(req.file.buffer,'binary');
    }
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,      // bucket that we made earlier
        Key: `Image-${Date.now()}.${correctmimetype[req.file.mimetype ]}`,               // Name of the image
        Body: buffer,                    // Body which will contain the image in buffer format
        ACL: "public-read-write",                 // defining the permissions to get the public link
        ContentType: req.file.mimetype                 // Necessary to define the image content-type to view the photo in the browser with the link
    };

    s3.upload(params, (error, data) => {
        if (error) {
            res.status(500).send({ "err": error })
            return;
        }
        const finalstyle = req.body.style || "";
        const finalcolour = req.body.colour || "";
        const greet = new Greets({
            festive: req.body.festive,
            style: finalstyle,
            colour: finalcolour,
            greet_image: data.Location,
            like_count:0,
            liked_by:[]
        });

        greet.save()
            .then((result) => {
                res.status(200).send({
                    _id: result._id,
                    festive: result.festive,
                    style: result.style || "",
                    colour: result.colour || "",
                    like_count: result.like_count,
                    liked_by:result.liked_by,
                    greet_image: data.Location
                })
            })
            .catch(err => {
                res.send({ message: err })
            })
    })
    return;
});

//post request to upload many files with random tags and festive 
router.post("/uploadmany", upload.any('greetimage'), async (req, res, next) => {
    // console.log(`req.files displays here :`);
    // console.log(req.files);
    let count = 0 ;
    req.files.map(file =>{
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,      // bucket that we made earlier
            Key: `Image-${Date.now()}.jpeg`,               // Name of the image
            Body: file.buffer,                    // Body which will contain the image in buffer format
            ACL: "public-read-write",                 // defining the permissions to get the public link
            ContentType: "image/jpeg"                 // Necessary to define the image content-type to view the photo in the browser with the link
        };
        s3.upload(params, (error, data) => {
            if (error) {
                res.status(500).send({ "err": error })
                return;
            }
            const random_festive = Math.floor(Math.random() * festive.length);
            const random_style = Math.floor(Math.random()* style.length);
            const random_colour = Math.floor(Math.random()* colour.length);

            const greet = new Greets({
                festive: festive[random_festive],
                style: style[random_style],
                colour: colour[random_colour],
                like_count:0,
                liked_by:[],
                greet_image: data.Location
            });
            
            greet.save()
                .then((result) => {
                    // console.log(data.Location);
                })
                .catch(err => {
                    res.send({ message: err })
                })
        })
        count+=1;
    });
    res.status(200).send({
        success:true,
        images_added: count
    }) 
    return;
});


module.exports = router;