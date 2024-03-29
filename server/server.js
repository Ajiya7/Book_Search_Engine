const express = require("express");
const path = require("path");
const db = require("./config/connection");
const routes = require("./routes");
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const {
  ApolloServerPluginDrainHttpServer,
} = require("@apollo/server/plugin/drainHttpServer");
const http = require("http");

const { typeDefs, resolvers } = require("./schemas");

const { authMiddleware } = require("./utils/auth");

const app = express();
const PORT = process.env.PORT || 3001;
const httpServer = http.createServer(app);
const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// if we're in production, serve client/build as static assets
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/build")));
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build/index.html"));
});

const startApolloServer = async (typeDefs, resolvers) => {
  await server.start();
  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: authMiddleware,
    })
  );
};

db.once("open", () => {
  app.listen(PORT, () => console.log(`🌍 Now listening on localhost:${PORT}`));
});

startApolloServer(typeDefs, resolvers)