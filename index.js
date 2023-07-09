const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// jwt verify function

const jwtVerify = (req, res, next) => {
   const authorization = req.headers.authorization;

   if (!authorization) {
      return res.status(401).send({ error: true, message: "No authorization Token" });
   }
   const token = authorization.split(" ")[1];
   jwt.verify(token, process.env.PRIVATE_KEY, (err, decoded) => {
      if (err) {
         return res.status(401).send({ error: true, message: "Unauthorized User" });
      }
      req.email = decoded.user.email;

      next();
   });
};

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.lvw8wzq.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
   serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
   },
});

async function run() {
   try {
      // Connect the client to the server	(optional starting in v4.7)
      // await client.connect();

      const database = client.db("OnlineBazar");
      const productCollection = database.collection("products");
      const cartCollection = database.collection("carts");
      const userCollection = database.collection("users");

      // jwt token post
      app.post("/jwt", (req, res) => {
         const user = req.body;
         const token = jwt.sign({ user }, process.env.PRIVATE_KEY, { expiresIn: "1h" });
         res.send({ token });
      });
      // products
      app.get("/products", async (req, res) => {
         const products = await productCollection.find({}).toArray();
         res.send(products);
      });

      app.get("/product/:id", async (req, res) => {
         const id = req.params.id;

         const product = await productCollection.findOne({ _id: new ObjectId(id) });
         res.send(product);
      });

      // carts

      app.put("/cart/:id", jwtVerify, async (req, res) => {
         const product = req.body.product;
         const id = req.params.id;
         const email = req.query.email;
         const exist = await cartCollection.findOne({ _id: id });
         const options = { upsert: true };
         if (exist) {
            const updateQuantity = {
               $set: {
                  quantity: exist.quantity + 1,
               },
            };

            const result = await cartCollection.updateOne({ _id: id }, updateQuantity, options);
            console.log("its updating");
            return res.send(result);
         } else {
            product.email = email;
            product.quantity = 1;
            const result = await cartCollection.insertOne(product);
            return res.send(result);
         }
      });

      app.get("/carts/:email", jwtVerify, async (req, res) => {
         const email = req.params.email;

         const carts = await cartCollection.find({ email }).toArray();
         res.send(carts);
      });

      app.get("/cart/:id", jwtVerify, async (req, res) => {
         const id = req.params.id;

         const carts = await cartCollection.findOne({ _id: id });
         res.send(carts);
      });
      app.delete("/cart/:id", jwtVerify, async (req, res) => {
         const id = req.params.id;

         const carts = await cartCollection.deleteOne({ _id: id });
         res.send(carts);
      });

      app.get("/carts", jwtVerify, async (req, res) => {
         const carts = await cartCollection.find({}).toArray();
         res.send(carts);
      });

      // Send a ping to confirm a successful connection
      await client.db("admin").command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
   } finally {
      // Ensures that the client will close when you finish/error
      //   await client.close();
   }
}
run().catch(console.dir);

app.get("/", (req, res) => {
   res.send("Hello World!");
});

app.listen(port, () => {
   console.log(`Example app listening on port ${port}`);
});
