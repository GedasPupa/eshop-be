const express = require('express');
const router = express.Router();
const {database} = require('../config/helpers');

// GET ALL PRODUCTS
router.get('/', function (req, res) {       // Sending Page Query Parameter is mandatory http://localhost:3636/api/products?page=1
    let page = (req.query.page !== undefined && req.query.page !== 0) ? req.query.page : 1;
    const limit = (req.query.limit !== undefined && req.query.limit !== 0) ? req.query.limit : 10;   // set limit of items per page
    let startValue;
    let endValue;
    if (page > 0) {
        startValue = (page * limit) - limit;     // 0, 10, 20, 30
        endValue = page * limit;                 // 10, 20, 30, 40
    } else {
        startValue = 0;
        endValue = limit;
    }
    database.table('products as p')
        .join([
            {
                table: "categories as c",
                on: `c.id = p.cat_id`
            }
        ])
        .withFields([
            'p.id',
            'c.title as category',
            'p.title as name',
            'p.price',
            'p.quantity',
            'p.description',
            'p.image',
        ])
        .slice(startValue, endValue)
        .sort({id: 1})
        .getAll()
        .then(prods => {
            if (prods.length > 0) {
                res.status(200).json({
                    count: prods.length,
                    products: prods
                });
            } else {
                res.json({message: "No products found"});
            }
        })
        .catch(err => console.log(err));
});

// GET ONE PRODUCT
router.get('/:product_Id', (req, res) => {
    let productId = req.params.product_Id;
    database.table('products as p')
        .join([
            {
                table: "categories as c",
                on: `c.id = p.cat_id`
            }
        ])
        .withFields([
            'p.id',
            'c.title as category',
            'p.title as name',
            'p.price',
            'p.quantity',
            'p.description',
            'p.image',
            'p.images'
        ])
        .filter({'p.id': productId})
        .get()
        .then(prod => {
            if (prod) {
                res.status(200).json(prod);
            } else {
                res.json({message: `No product with id ${productId} found`});
            }
        })
        .catch(err => console.log(err));
});



module.exports = router;
