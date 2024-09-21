require('dotenv').config({path:"../../config.env"});
const jwt = require('jsonwebtoken');
module.exports = (req,res,next) =>{
        const token = req.headers['authorization'];

        if(!token){
            res.status(403).json({success:false,message:"Token missing or invalid"});
        }
        
        jwt.verify(token,process.env.JWTSECRETKEY,(err,user)=>{
            if(err){
                res.status(403).json({success:false,message:"Invalid or expired token!"})
            }
            req.user=user;
            next();
        });
}

// module.exports = authenticateToken;