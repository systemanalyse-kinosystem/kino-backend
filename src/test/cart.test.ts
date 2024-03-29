import app from "../app";
import testUtils from "./testUtils";
import chai from "chai"
import chaiHttp from "chai-http";
import { CallbackError } from "mongoose";
import User from "../api/models/user.model";
import Cart from "../api/models/cart.model";
import Ticket from "../api/models/ticket.model";
import IUser from "../api/interfaces/user.interface";
import { ICartNotPopulated } from "../api/interfaces/cart.interface";
import ITicket from "../api/interfaces/ticket.interface";
import { uniqueNamesGenerator, Config, names } from 'unique-names-generator';
import bcrypt from "bcrypt";
import utils from "../api/utils/utils";
import Screening from "../api/models/screening.model";

chai.use(chaiHttp)
let should = chai.should()

describe('Cart Routes', function () {
    this.timeout(5000)
    let cartId1: string;
    let cartId2: string;
    let cartId3: string;
    let cartId4: string;
    let customerToken: string;
    let customerId: string;
    let ticketId1: string;
    let ticketId2: string;
    let ticketId3: string;
    let ticketId4: string;
    let name = uniqueNamesGenerator({ dictionaries: [names] });

    before('Setup: Create demo cart, customer and tickets', async () => {
        try {
            let testScreening = await Screening.findOne({});
            let seat = {
                rowNumber: 1,
                colNumber: 1,
                type: "parquet"
            };
            let ticket1 = await Ticket.create({ status: 'selected', screening: testScreening, seat: seat });
            let ticket2 = await Ticket.create({ status: 'selected', screening: testScreening, seat: seat });
            let ticket3 = await Ticket.create({ status: 'selected', screening: testScreening, seat: seat });
            let ticket4 = await Ticket.create({ status: 'selected', screening: testScreening, seat: seat });
            
            ticketId1 = ticket1._id;
            ticketId2 = ticket2._id;
            ticketId3 = ticket3._id;
            ticketId4 = ticket4._id;

            let cart1 = await Cart.create({ tickets: [ticketId1] });
            let cart2 = await Cart.create({ tickets: [ticketId2] });
            let cart3 = await Cart.create({ tickets: [ticketId3] });
            let cart4 = await Cart.create({ tickets: [ticketId4] });
            
            cartId1 = cart1._id;
            cartId2 = cart2._id;
            cartId3 = cart3._id;
            cartId4 = cart4._id;

            let user = await User.create({
                firstName: name,
                lastName: name,
                email: name + "@kinosystem.de",
                password: bcrypt.hashSync("test1234", 10),
                role: "customer",
                address: {
                    street: "Teststraße 15",
                    postalCode: "25980",
                    city: "Sylt",
                    country: "Germany"
                }
            });
            customerToken = utils.createToken(user).token;
            customerId = user._id;
            //redundant - refactor
        } catch (e) {
            console.error(e);
            "1".should.equal("2");
        }
    });

    after('Teardown: Delete demo cart, customer and tickets', (done) => {
        Cart.deleteMany({ _id: { $in: [cartId1, cartId2] } }, (err1: CallbackError) => {
            Ticket.deleteMany({ _id: { $in: [ticketId1, ticketId2] } }, (err2: CallbackError) => {
                User.findOneAndDelete({ _id: customerId }, {}, (err3: CallbackError) => {
                    if (err1) { return done(err1); }
                    if (err2) { return done(err2); }
                    if (err3) { return done(err3); }
                    done();
                });
            });
        });
    });


    //get the function and call it with (done)
    it('returns a single cart', (done) => {
        testUtils.getDocumentSingleTest('/cart', "", cartId1, 'tickets')(done)
    });

    it('creates a cart', (done) => {
        chai.request(app)
            .post('/api/v1/cart')
            .end((err: Error, res: ChaiHttp.Response): void => {
                if (err) { return done(err); }
                res.body.should.be.a('object');
                Cart.findOneAndDelete({ _id: res.body.id }, {}, (err: CallbackError | null, cart: ICartNotPopulated | null) => {
                    if (err || !cart) { return done(err); }
                    cart.should.have.property('tickets');
                    done();
                });
            });
    });

    it('checks out a cart (booking) without login', (done) => {
        chai.request(app)
            .put(`/api/v1/cart/checkout/book/${cartId1}`)
            .send({
                firstName: name,
                lastName: name,
                email: "noreply.kinosystem@gmail.com",
                password: bcrypt.hashSync("test1234", 10),
                role: "customer",
                address: {
                    street: "Teststraße 15",
                    postalCode: "25980",
                    city: "Sylt",
                    country: "Germany"
                }
            })
            .end((err: Error, res: ChaiHttp.Response): void => {
                if (err) { return done(err); }
                res.body.should.be.a('object');
                res.body.should.have.property('tickets');
                res.body.tickets.should.have.lengthOf.below(1);

                Ticket.findById(ticketId1, (err: CallbackError | null, ticket: ITicket | null) => {
                    if (err || !ticket) { return done(err); }
                    ticket.should.have.property('status').equal('valid');
                    ticket.user.should.have.property('firstName').equal(name);
                    done();
                });
            });
    });

    it('checks out a cart (booking) with login', (done) => {
        chai.request(app)
            .put(`/api/v1/cart/checkout/book/me/${cartId2}`)
            .set('auth', customerToken)
            .end((err: Error, res: ChaiHttp.Response): void => {
                if (err) { return done(err); }
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('tickets');
                res.body.tickets.should.have.lengthOf.below(1);

                Ticket.findById(ticketId2, (err: CallbackError | null, ticket: ITicket | null) => {
                    if (err || !ticket) { return done(err); }
                    ticket.should.have.property('status').equal('valid');
                    ticket.userID.toString().should.be.equal(customerId.toString());
                    done();
                });
            });
    });


    it('checks out a cart (reservation)', (done) => {
        chai.request(app)
            .put(`/api/v1/cart/checkout/reserve/${cartId3}`)
            .set('auth', customerToken)
            .end((err: Error, res: ChaiHttp.Response): void => {
                console.log(res.body);
                console.log(err);
                if (err) { return done(err); }
                res.body.should.be.a('object');
                res.body.should.have.property('tickets');
                res.body.tickets.should.have.lengthOf.below(1);

                Ticket.findById(ticketId3, (err: CallbackError | null, ticket: ITicket | null) => {
                    if (err || !ticket) { return done(err); }
                    ticket.should.have.property('status').equal('reserved');
                    ticket.userID.toString().should.be.equal(customerId.toString());
                    done();
                });
            });
    });

    it('checks out a cart (reservation) without login', (done) => {
        chai.request(app)
            .put(`/api/v1/cart/checkout/reserve/nologin/${cartId4}`)
            .send({
                firstName: name,
                lastName: name,
                email: "noreply.kinosystem@gmail.com",
                password: bcrypt.hashSync("test1234", 10),
                role: "customer",
                address: {
                    street: "Teststraße 15",
                    postalCode: "25980",
                    city: "Sylt",
                    country: "Germany"
                }
            })
            .end((err: Error, res: ChaiHttp.Response): void => {
                console.log(res.body);
                if (err) { return done(err); }
                res.body.should.be.a('object');
                res.body.should.have.property('tickets');
                res.body.tickets.should.have.lengthOf.below(1);

                Ticket.findById(ticketId4, (err: CallbackError | null, ticket: ITicket | null) => {
                    if (err || !ticket) { return done(err); }
                    ticket.should.have.property('status').equal('reserved');
                    ticket.user.should.have.property('firstName').equal(name);
                    done();
                });
            });
    });

});
