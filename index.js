const port = 4000;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");

app.use(express.json());
app.use(cors());

//Coneção Banco de Dados com MongoDB

mongoose.connect(
  "mongodb+srv://Guilherme:123@cluster0.heruc.mongodb.net/e-commerce"
);

//Criação API

<div>Hello World</div>

app.get("/", (req, res) => {
  res.send("Express App is Running");
});

//Image Storage Engine

const storage = multer.diskStorage({
  destination: "./upload/images",
  filename: (req, file, cb) => {
    return cb(
      null,
      `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({ storage: storage });

//Creating Upload Endpoint for images
app.use("/images", express.static("upload/images"));

app.post("/upload", upload.single("product"), (req, res) => {
  res.json({
    sucess: 1,
    image_url: `http://localhost:${port}/images/${req.file.filename}`,
  });
});

// Schema for creaing products
const Product = mongoose.model("Product", {
  id: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  new_price: {
    type: Number,
    required: true,
  },
  old_price: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  avilable: {
    type: Boolean,
    default: true,
  },
});

app.post("/addproduct", async (req, res) => {
  let products = await Product.find({});
  let id;
  if (products.length > 0) {
    let last_product_array = products.slice(-1);
    let last_product = last_product_array[0];
    id = last_product.id + 1;
  } else {
    id = 1;
  }
  const product = new Product({
    id: id,
    name: req.body.name,
    image: req.body.image,
    category: req.body.category,
    new_price: req.body.new_price,
    old_price: req.body.old_price,
  });
  console.log(product);
  await product.save();
  console.log("Save");
  res.json({
    sucess: true,
    name: req.body.name,
  });
});

//Creating api for deleting products

app.post("/removeproduct", async (req, res) => {
  await Product.findOneAndDelete({ id: req.body.id });
  console.log("Removed");
  res.json({
    sucess: true,
    name: req.body.name,
  });
});

//Creating API for getting all procuts

app.get("/allproducts", async (req, res) => {
  let products = await Product.find({});
  console.log("all products fetched");
  res.send(products);
});

//Schema creating for user model

const Users = mongoose.model("Users", {
  name: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
  },
  password: {
    type: String,
  },
  cartData: {
    type: Object,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

// Creating endpoint for register the user
app.post("/signup", async (req, res) => {
  let check = await Users.findOne({ email: req.body.email });
  if (check) {
    return res
      .status(400)
      .json({
        sucess: false,
        errors: "existing user found with same email address",
      });
  }

  let cart = {};
  for (let i = 0; i < 300; i++) {
    cart[i] = 0;
  }

  const user = new Users({
    name: req.body.username,
    email: req.body.email,
    password: req.body.password,
    cartData: cart,
  });

  await user.save();
  const data = {
    user: {
      id: user.id,
    },
  };

  const token = jwt.sign(data, "secret_ecom");
  res.json({
    sucess: true,
    token,
  });
});

//creating endpoint for user login

app.post("/login", async (req, res) => {
  let user = await Users.findOne({
    email: req.body.email,
  });
  if (user) {
    const passCompare = req.body.password === user.password;
    if (passCompare) {
      const data = {
        user: {
          id: user.id,
        },
      };
      const token = jwt.sign(data, "secret-ecom");
      res.json({
        sucess: true,
        token,
      });
    } else {
      res.json({
        sucess: false,
        errors: "Wrong password",
      });
    }
  } else {
    res.json({
      sucess: false,
      errors: "Wrong email id",
    });
  }
});

//creating endpoint for new collection data

app.get("/newcollections", async (req, res) => {
  let products = await Product.find({});
  let newcollection = products.slice(1).slice(-8);
  console.log("News collections deu certo");
  res.send(newcollection);
});

//creating endpoint for popular in women section

app.get("/popularinwomen", async (req, res) => {
  let procuts = await Product.find({ category: "women" });
  let popular_in_women = procuts.slice(0, 4);
  console.log("Popular Women deu certo");
  res.send(popular_in_women);
});

//creating middelware to fethc user
const fetchUser = async (req, res, next) => {
  const token = req.header("auth-token");
  if (!token) {
    return res
      .status(401)
      .send({ errors: "Please authenticate using a valid token" });
  }
  try {
    const data = jwt.verify(token, "secret-ecom");
    req.user = data.user;
    next();
  } catch (error) {
    return res
      .status(401)
      .send({ errors: "Por favor authenticate using a valid token" });
  }
};

// Criando endpoint para adicionar produtos no carrinho
app.post("/addtocart", fetchUser, async (req, res) => {
  console.log("adicionou", req.body.itemId);
  let userData = await Users.findOne({ _id: req.user.id });
  userData.cartData[req.body.itemId] += 1;
  await Users.findOneAndUpdate(
    { _id: req.user.id },
    { cartData: userData.cartData }
  );
  res.status(200).send({ message: "Produto adicionado ao carrinho" });
});

//creating endpoint to remove product from cart data
app.post("/removefromcart", fetchUser, async (req, res) => {
  console.log("removeu", req.body.itemId);
  let userData = await Users.findOne({ _id: req.user.id });
  if (userData.cartData[req.body.itemId] > 0)
    userData.cartData[req.body.itemId] -= 1;
  await Users.findOneAndUpdate(
    { _id: req.user.id },
    { cartData: userData.cartData }
  );
  res.status(200).send({ message: "Produto removido do carrinho" });
});

//creating endpoint for get cartdata

app.post("/getcart", fetchUser, async (req, res) => {
  console.log("GetCart");
  let userData = await Users.findOne({ _id: req.user.id });
  res.json(userData.cartData);
});

app.listen(port, (error) => {
  if (!error) {
    console.log("Server Running on Port " + port);
  } else {
    console.log("Error: " + error);
  }
});
