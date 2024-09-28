const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const multer = require('multer')

const User = require("../models/User")

//configuration multer for file upload 
const storage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null,"public/uploads/")  //store uploaded file in the folder "uploads"
    },
    filename: function(req,file,cb){
        cb(null, file.originalname) //use original file name
    }
})

const upload = multer({storage})

// user register

router.post('/register',upload.single('profileImage'),async(req,res)=>{
    try{
        const {firstName, lastName, email, password} = req.body
        // upload file is available as req.file
        const profileImage = req.file
        if(!profileImage){
            return res.status(400).send("No file uploaded")
        }
        
        //path to the uploaded profile photo
        const profileImagePath =  profileImage.path
        
        //check if user exists
        const existingUser = await User.findOne({email})
        if(existingUser){
            return res.status(409).json({message:"User already exists!"})
        }

        // hash password
        const salt = await bcrypt.genSalt()
        const hashPassword = await bcrypt.hash(password,salt)

        //create new user
        const newUser = new User({
            firstName, lastName,email,
            password: hashPassword,
            profileImagePath,
        })

        //save a new user 
        await newUser.save()

        //send successfully message
        res.status(200).json({message: "User registered successfully", user: newUser})
    }catch(err){
        console.log(err)
        res.status(500).json({message:"Registration failed!", error: err.message})
    }
})

//user login 
router.post('/login', async(req,res)=>{
    try{
        const {email, password} = req.body

        const user =await User.findOne({email});
            if(!user){
                return res.status(409).json({message: "User doesn't exist!"})
            }
        // compare the password with hashed password
            const isMatch = await bcrypt.compare(password, user.password)
            if(!isMatch){
                return res.status(400).json({message:"Invalid Credentials!"})
            }

            // generate jwt token
            const token = jwt.sign({id: user._id}, process.env.JWT_SECRET)
            delete user.password

            res.status(200).json({token,user})
        
    }catch(err){
        console.log(err)
        return res.status(500).json({
            error: err.message
        })

    }
})

module.exports = router