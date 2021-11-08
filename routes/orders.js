const express = require('express');
const router = express.Router();
const {database} = require('../config/helpers');

// GET ALL ORDERS
router.get('/', function (req, res) {
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
router.post('/new', async (req, res) => {
    let {id: userId, products} = req.body;

    // product.id check, products.quantity-products.incart check:
    const purchasedProducts = [];
    const notPurchased = [];
    products.forEach(async p => {
        let data = await database.table('products').filter({id: p.id}).withFields(['quantity']).get();
        if (data && data.quantity >= p.incart && p.incart !== null && p.incart > 0 && !isNaN(p.incart)) {
            purchasedProducts.push({p});
        } else {
            notPurchased.push({p});
        }
    });

    // userId check // placing the order
    if (userId !== null && userId > 0 && !isNaN(userId)) {
        database.table('orders')
        .insert({
            user_id: userId,
        })
        .then(newOrder => {
            if (newOrder.affectedRows > 0) {
                products.forEach(async p => {
                    let data = await database.table('products').filter({id: p.id}).withFields(['quantity']).get();
                    let inCart = p.incart;

                    // Deduct the number of pieces ordered from quantity column in DB
                    if (data && data.quantity >= inCart) {
                        data.quantity -= inCart;                              
                    } else {
                        console.log(`Not enough products for product with id:`, +p.id);
                        return;
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
            if (notPurchased.length > 0) {
                res.json({
                    message: `Order placed with order id ${newOrder.insertId}`,
                    success: purchasedProducts.length > 0 ? true : false,
                    order_id: newOrder.insertId,
                    purchased_products: purchasedProducts,
                    not_purchased: notPurchased,
                });
            } else {
                res.json({
                    message: `Order succesffully placed with order id ${newOrder.insertId}`,
                    success: true,
                    order_id: newOrder.insertId,
                    purchased_products: purchasedProducts,
                });
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error_message: err,
                success: false
            });
        });
    } else {
        res.json({
            error_message: `Your order failed. User id: ${userId} not valid.`,
            success: false
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
