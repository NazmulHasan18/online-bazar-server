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
   console.log("hit");
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
      await client.connect();

      const database = client.db("OnlineBazar");
      const productCollection = database.collection("products");

      // jwt token post
      app.post("/jwt", (req, res) => {
         const user = req.body;
         const token = jwt.sign({ user }, process.env.PRIVATE_KEY, { expiresIn: "1h" });
         res.send(token);
      });

      app.get("/products", async (req, res) => {
         const products = await productCollection.find({}).toArray();
         res.send(products);
      });
      app.get("/product/:id", async (req, res) => {
         const id = req.params.id;

         const product = await productCollection.findOne({ _id: new ObjectId(id) });
         res.send(product);
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