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
    const orderId = req.params.order_id;
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
            if (order.length > 0) {
                res.status(200).json(order);
            } else {
                res.json({ message: `No order with id ${orderId} found.`});
            }
        })
        .catch (err => console.log(err));
});

// PLACE A NEW ORDER
router.post('/new', (req, res) => {
    let {id: userId, products} = req.body;
    if (userId !== null && userId > 0 && !isNaN(userId)) {
        database.table('orders')
        .insert({
            user_id: userId,
        })
        .then(newOrder => {
            console.log(newOrder.affectedRows);
            console.log(newOrder.insertId);
            if (newOrder.insertId > 0) {
                products.forEach(async p => {
                    let data = await database.table('products').filter({id: p.id}).withFields(['quantity']).get();
                    let inCart = p.incart;

                    // Deduct the number of pieces ordered from quantity column in DB
                    if (data.quantity >= inCart) {
                        data.quantity -= inCart;                              
                    } else {
                        console.log('Not enough products for this order');
                        // res.json({message: 'Not enough products for this order', success: false});
                        // return;
                    }

                    // INSERT to orders_details with respect to newly generated order_id
                    database.table('orders_details')
                    .insert({
                        order_id: newOrder.insertId,
                        product_id: p.id,
                        quantity: inCart,
                    })
                    // UPDATE products.quantity field
                    .then(newId => {
                        database.table('products')
                        .filter({id: p.id})
                        .update({
                            quantity: data.quantity
                        })
                        .then(successNum => {})
                        .catch(err => console.log(err));
                    })
                    .catch(err => console.log(err));              
                });

            } else {
                res.json({message: 'New order failed while adding order details.', success: false});
            }
            res.json({
                message: `Order succesffully placed with order id ${newOrder.insertId}`,
                success: true,
                order_id: newOrder.insertId,
                products: products
            });
        })
        .catch(err => console.log(err));
    } else {
        res.json({
            message: `Your order failed. User id: ${userId} not valid.`,
            success: false,
        })
    }
});

// FAKE GATEWAY PAYMENT CALL
router.post('/payment', (req, res) => {
    setTimeout(() => {
        res.status(200).json({success: true});
    }, 1500);
});

module.exports = router;
