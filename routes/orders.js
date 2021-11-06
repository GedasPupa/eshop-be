const express = require('express');
const router = express.Router();
const {database} = require('../config/helpers');

// GET ALL ORDERS
router.get('/', function (req, res) {       // Sending Page Query Parameter is mandatory http://localhost:3636/api/products?page=1
    // const page = (req.query.page !== undefined && req.query.page !== 0) ? req.query.page : 1;
    // const limit = (req.query.limit !== undefined && req.query.limit !== 0) ? req.query.limit : 10;   // set limit of items per page
    // let startValue;
    // let endValue;
    // if (page > 0) {
    //     startValue = (page * limit) - limit;     // 0, 10, 20, 30
    //     endValue = page * limit;                 // 10, 20, 30, 40
    // } else {
    //     startValue = 0;
    //     endValue = limit ? limit : 10;
    // }
    database.table('orders as o')
        .join([
            {
                table: "orders_details as o_d",
                on: `o.id = o_d.order_id`,
            },
            {
                table: `products as p`,
                on: `o_d.product_id = p.id`,
            },
            {
                table: `users as u`,
                on: `o.user_id = u.id`,
            }
        ])
        .withFields([
            'o.id as order_id',
            'p.title as product_name',
            'p.description',
            'p.price',
            'u.username'
        ])
        // .slice(startValue, endValue)
        .sort({'o.id': 1})
        .getAll()
        .then(orders => {
            if (orders.length > 0) {
                res.status(200).json(orders);
            } else {
                res.json({message: "No orders found."});
            }
        })
        .catch(err => console.log(err));
});

// GET ONE ORDER
router.get('/:order_id', (req, res) => {
    const orderId = +req.params.order_id;
    database.table('orders as o')
        .join([
            {
                table: "orders_details as o_d",
                on: `o.id = o_d.order_id`,
            },
            {
                table: `products as p`,
                on: `o_d.product_id = p.id`,
            },
            {
                table: `users as u`,
                on: `o.user_id = u.id`,
            }
        ])
        .withFields([
            'o.id as order_id',
            'p.title as product_name',
            'p.description',
            'p.price',
            'u.username'
        ])
        .filter({'o.id': orderId})
        .getAll()
        .then(order => {
            if (order) {
                res.status(200).json({order});
            } else {
                res.json({ message: `No order with id ${orderId} found.`});
            }
        })
        .catch (err => console.log(err));
});

module.exports = router;
