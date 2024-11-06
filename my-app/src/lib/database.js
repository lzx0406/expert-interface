import dotenv from "dotenv";
dotenv.config(); // Load environment variables from .env file

import mysql from "mysql2/promise";
// import {
//   SecretsManagerClient,
//   GetSecretValueCommand,
// } from "@aws-sdk/client-secrets-manager";

// /**
//  * @type {mysql.Pool}
//  */
// let db;

// // @ts-ignore
// const client = new SecretsManagerClient({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   },
// });

// async function getDatabaseCredentials() {
//   try {
//     const response = await client.send(
//       new GetSecretValueCommand({
//         SecretId: process.env.SECRET_NAME,
//         VersionStage: "AWSCURRENT",
//       })
//     );

//     if ("SecretString" in response) {
//       return JSON.parse(response.SecretString);
//     }
//   } catch (error) {
//     console.error("Error retrieving database credentials:", error);
//     throw new Error("Could not retrieve database credentials");
//   }
// }

// export async function initDb() {
//   if (!db) {
//     const { host, username, password, database } =
//       await getDatabaseCredentials();

//     db = mysql.createPool({
//       host: host || "aiexpertsdb.ch0mqku8apof.us-east-2.rds.amazonaws.com",
//       user: username || "admin",
//       password: password,
//       database: database || "aiexpertsdb",
//       waitForConnections: true,
//       connectionLimit: 10,
//       queueLimit: 0,
//     });

//     console.log("Database pool created successfully");
//   }
// }

// export { db };

// @ts-ignore
export const db = mysql.createPool({
  host: "aiexpertsdb.ch0mqku8apof.us-east-2.rds.amazonaws.com", // Your RDS endpoint
  user: "admin", // Your RDS username
  password: "", // Your RDS password
  database: "aiexpertsdb", // The database you created
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
