import express from "express";
import * as bodyParser from "body-parser";
import compression from "compression";
import cors from "cors";
import morgan from 'morgan';
import mongoose from "mongoose";

//import Router
import apiRouter from "./api/routes/routes";

//setup environment variables
import dotenv from 'dotenv';
import { utils } from "mocha";
import myUtils from "./api/utils/utils";

dotenv.config();

//setup app
const app = express();

//setup database connection
mongoose.connect(<string>process.env.DATABASE_URL, { useNewUrlParser: true });

//setup ejs
app.set('views', __dirname + '/src/api/email_template');
app.engine('html', require('ejs').renderFile);


//setup app config
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(compression());
app.use(cors());
app.use(morgan('dev'));

//API - router
app.use('/api/v1', apiRouter);

app.use('/', (req: express.Request, res: express.Response) => {
    res.send("Hello World from CI");
});


//register automatic background jobs for cleanup
myUtils.registerBackGroundJobs();

//listen
app.listen(<string>process.env.PORT, () => console.log("Server started on Port: " + <string>process.env.PORT));

export default app;