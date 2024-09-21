const express = require("express");
const router = express.Router();
const multer = require('multer');
const Aws = require("aws-sdk");
require('aws-sdk/lib/maintenance_mode_message').suppress = true;
// the above line5 is wriiten in order to supress the warning
const Greets = require("../models/greetSchema"),
    Users = require("../models/userSchema"),
    Wishlist = require("../models/wishlistSchema"),
    Liked = require("../models/likeSchema");
require("dotenv").config({ path: "../../config.env" });
const { festive, style, colour } = require("../randomft");



const storage = multer.memoryStorage({
    destination: function (req, file, cb) {
        cb(null, '')
    }
});

const correctmimetype = {
    'image/jpeg': "jpeg",
    'image/jpg': "jpeg",
    'application/octet-stream': "jfif",
    'image/png': "png"

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
    const reg = new RegExp(`[a-zA-Z0-9_]*${req.query.festive}`, 'i');
    let images = await Greets.find({
        festive: reg
    });
    let imagesarr = [];
    let resultset = new Set();
    images.map(ele => resultset.add(JSON.stringify(ele)));
    if (req.query.festive.includes(' ')) {
        const words = req.query.festive.split(' ');
        await Promise.all(words.map(async word => {
            const arr = await Greets.find({ festive: new RegExp(`[a-zA-Z0-9_]*${word}`, 'i') });
            arr.forEach(element => {
                resultset.add(JSON.stringify(element));
            });
            return;
        }))
        resultset.forEach(ele => {
            imagesarr.push(JSON.parse(ele));
        })
        images = new Array(...imagesarr);
    }

    // console.log(images);
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
    if (req.query.style && req.query.colour) {
        images.map(element => {
            if (element.style === req.query.style && element.colour === req.query.colour) {
                urlArray.push(element);
            }
            return;
        })
    }
    else if (req.query.style) {
        images.map(element => {
            if (element.style === req.query.style) {
                urlArray.push(element);
            }
            return;
        })
    }
    else if (req.query.colour) {
        images.map(element => {
            if (element.colour === req.query.colour) {
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
router.get("/:id", async (req, res) => {
    const image = await Greets.findById(req.params.id);
    if (!image) res.status(404).send("Error in fetching image.");

    res.status(200).json({
        success: true,
        data: image
    });
})

// router.put("/removelikedby",async (req,res)=>{
//     try{
//        const result=  await Greets.updateMany({},{$set:{"like_count":0}});
//         return res.status(200).json({message:"success",data:result});

//     }
//     catch(err){
//         return res.status(500).json({success:false,message:"something bad happens",error:err})
//     }
// })
//post a single image 
router.post("/", upload.single('greetimage'), async (req, res, next) => {
    let buffer = req.file.buffer;
    if (req.file.mimetype === 'application/octet-stream') {
        buffer = Buffer.from(req.file.buffer, 'binary');
    }
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,      // bucket that we made earlier
        Key: `Image-${Date.now()}.${correctmimetype[req.file.mimetype]}`,               // Name of the image
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
            like_count: 0,
            liked_by: []
        });

        greet.save()
            .then((result) => {
                res.status(200).send({
                    _id: result._id,
                    festive: result.festive,
                    style: result.style || "",
                    colour: result.colour || "",
                    like_count: result.like_count,
                    liked_by: result.liked_by,
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
    let count = 0;
    req.files.map(file => {
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
            const random_style = Math.floor(Math.random() * style.length);
            const random_colour = Math.floor(Math.random() * colour.length);

            const greet = new Greets({
                festive: festive[random_festive],
                style: style[random_style],
                colour: colour[random_colour],
                like_count: 0,
                liked_by: [],
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
        count += 1;
    });
    res.status(200).send({
        success: true,
        images_added: count
    })
    return;
});

//router to delete a greet Image from the database
router.delete("/deleteGreet/:greet_id", async (req, res) => {
    try {
        const { greet_id } = req.params;
        const greet = await Greets.findOne({ _id: greet_id });
        if (!greet) {
            return res.status(200).json({ success: false, message: "Greet not found!" });
        }
        if (greet.like_count > 0) {
            const Like_arr = await Liked.deleteMany({ greet_id });
        }
        const wishlist_arr = await Wishlist.find({ greet_id });
        wishlist_arr.forEach(async wishlistElement => {
            var user = await Users.findOne({ _id: wishlistElement.user_id });
            user.totalWishlistItem -= 1;
            await user.save();
        });
        //delete from aws s3 bucket
        const imageUrl = greet.greet_image;
        const imageUrlMatch = imageUrl.match(/(Image-\d+\.jpeg)/);
        const imageName = imageUrlMatch[0];
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME, // bucket that we made earlier
            Key: imageName // Name of the image            
        };
        try {
            await s3.deleteObject(params).promise();
            console.log(`successfully deleted ${imageName} from ${process.env.AWS_BUCKET_NAME} `);
        } catch (err) {
            return res.status(400).json({success:false,message:"unable to delete the image from amazon aws",error:err});
        }
        const result = await Greets.deleteOne({ _id: greet_id });
        return res.status(200).json({ success: true, message: "Greet Image deleted Successfully!", data: result });
    } catch (err) {
        return res.status(500).json({ success: false, message: "server Error", error: err });
    }
})

module.exports = router;