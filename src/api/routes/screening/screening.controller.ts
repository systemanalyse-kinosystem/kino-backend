//replace screening, Screening, IScreening
import { Request, Response } from 'express';
import { CallbackError} from 'mongoose';
import Screening from '../../models/screening.model';
import IScreening from '../../interfaces/screening.interface';
import Hall from '../../models/hall.model';
import IHall from '../../interfaces/hall.interface';
import Ticket from '../../models/ticket.model';

export default class screeningController {

    static async getScreeningList(req: Request, res: Response) {
        //build queryOptions
        let sortOptions: any = {};
        sortOptions[<string>req.query.orderby] = <string>req.query.orderdir;
        let perPage = req.query.perPage ? parseInt(<string>req.query.perPage) : 10;
        let dateOptions = req.query.dateBegin && req.query.dateEnd ? {startDate: {$gte : new Date(<string>req.query.dateBegin), $lt : new Date(<string>req.query.dateEnd)}}: {};
        let movieOptions = req.query.movie ? {_id: <string>req.query.movie}: {};

        Screening.find({...movieOptions, ...dateOptions}, null, {
            skip: parseInt(<string>req.query.page) * perPage,
            limit: perPage,
            sort: sortOptions,
            populate: ['movie', 'hall']
        }, (err: CallbackError | null, screenings: IScreening[] | null) => {
            if (err) { return res.status(500).json(err) }
            if (!screenings) { return res.status(500).json({ err: err ? err : "Not found" }); }
            res.json(screenings);
        });
    };

    static getScreeningById(req: Request, res: Response) {
        Screening.findOne({ _id: req.params.id }, null, { populate: ['movie', 'hall'] }, (err: CallbackError | null, screening: IScreening | null) => {
            if (!screening || err) { return res.status(500).json({ err: err ? err : "Not found" }); }
            res.json(screening);
        });
    };

    static getScreeningByMovieId(req: Request, res: Response) {
        //build sortOptions and seachOptions
        let sortOptions: any = {};
        sortOptions[<string>req.query.orderby] = <string>req.query.orderdir;
        let perPage = req.query.perPage ? parseInt(<string>req.query.perPage) : 10;
        Screening.find({ movie: req.params.id }, null, {
            skip: parseInt(<string>req.query.page) * perPage,
            limit: perPage,
            sort: sortOptions,
            populate: ['movie', 'hall']
        }, (err: CallbackError | null, screenings: IScreening[] | null) => {
            if (err) { return res.status(500).json(err) }
            if (!screenings) { return res.status(500).json({ err: err ? err : "Not found" }); }
            res.json(screenings);
        });
    };

    /* DEACTIVATED FOR MVP
        static createScreening(req: Request, res: Response) {
            Screening.create(req.body, (err: CallbackError | null, screening: IScreening | null) => {
                if (err || !screening) { return res.status(400).json({ err: err?err:"Not found" }); }
                Hall.findById(screening.hall, (err: CallbackError | null, hall: IHall | null) => {
                    if (err || !hall) { return res.status(500).json({ err: err?err:"Not found" }); }
                    let ticketBodies = hall.seats.map(seatId => { return { seat: seatId, screening: screening._id}});
                    Ticket.insertMany(ticketBodies, {}, (err: CallbackError, result:any) => {
                        if(err) {
                            return res.status(500).json({err: "An Error occurred (Seatcreation)"});
                        }
                        res.json(screening);
                    }); 
                });
            });
        }
    
        static deleteScreeningById(req: Request, res: Response) {
            Screening.findOneAndDelete({
            }, {}, (err: CallbackError | null, screening: IScreening | null) => {
                if (err) { return res.status(400).json({ err: err?err:"Not found" }); }
                res.status(204).json({});
            });
        }
        static deleteScreenings(req: Request, res: Response) {
            Screening.deleteMany((err: CallbackError | null, screening: IScreening | null) => {
                if (err) { return res.status(500).json({ err: err?err:"Not found" }); }
                res.status(204).json({});
            });
        }
    
        static updateScreeningById(req: Request, res: Response) {
            Screening.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true }, (err: CallbackError | null, screening: IScreening | null) => {
                if (!screening || err) { return res.status(500).json({ err: err?err:"Not found" }); }
                res.json(screening);
            });
        }
        */
}