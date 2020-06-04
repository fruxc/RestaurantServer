const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const authenticate = require("../authenticate");
const cors = require("./cors");
const Favorites = require("../models/favorites");

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter
  .route("/")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id }, (err, favorite) => {
      if (err) {
        return next(err);
      }
    })
      .populate("user")
      .populate("dishes")
      .then(
        (favorites) => {
          if (favorites !== null) {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(favorites);
          } else {
            res.statusCode = 403;
            res.end("No Favorites Found");
          }
        },
        (err) => next(err)
      )
      .catch((err) => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id }, (err, favorite) => {
      if (err) {
        return next(err);
      }
      if (!favorite) {
        Favorites.create({ user: req.user._id })
          .then(
            (favorite) => {
              for (var dish = 0; dish < req.body.dishes.length; dish++) {
                favorite.dishes.push(req.body.dishes[dish]);
              }
              favorite.save().then((favorite) => {
                console.log("Favorites has been added successfully", favorite);
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(favorite);
              });
            },
            (err) => next(err)
          )
          .catch((err) => next(err));
      } else {
        for (var dish = 0; dish < req.body.dishes.length; dish++) {
          if (favorite.dishes.indexOf(req.body.dishes[dish]) < 0) {
            favorite.dishes.push(req.body.dishes[dish]);
          }
        }
        favorite.save().then((favorite) => {
          console.log("Favorite added ", favorite);
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(favorite);
        });
      }
    });
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end(`PUT operation not supported on /favorite`);
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.remove({ user: req.user._id })
      .then(
        (rem) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(rem);
        },
        (err) => next(err)
      )
      .catch((err) => next(err));
  });

//DISH ID FOR FAVORITES

favoriteRouter
  .route("/:dishId")
  .options(cors.corsWithOptions, (req, res) => {
    res.statusCode(200);
  })
  .get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findById(req.params.dishId)
      .populate("user")
      .populate("dish")
      .then(
        (Favorites) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(Favorites);
        },
        (err) => next(err)
      )
      .catch((err) => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    // check whether dish has been already added to the favorites
    Favorites.findOne({ user: req.user._id }, (err, favorite) => {
      if (err) {
        return next(err);
      }
      if (!favorite) {
        Favorites.create({ user: req.user._id })
          .then(
            (favorite) => {
              favorite.dishes.push(req.params.dishId);
              favorite.save().then((favorite) => {
                console.log("Favorite Created ", favorite);
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(favorite);
              });
            },
            (err) => next(err)
          )
          .catch((err) => next(err));
      } else {
        if (favorite.dishes.indexOf(req.params.dishId) < 0) {
          favorite.dishes.push(req.params.dishId);
          favorite.save().then((favorite) => {
            console.log("Favorite added ", favorite);
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(favorite);
          });
        } else {
          res.statusCode = 200;
          res.end("Favorite already added!!");
        }
      }
    });
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end("PUT operation not supported on /favorite/" + req.params.dishId);
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id }, (err, favorite) => {
      if (err) {
        return next(err);
      }
      if (!favorite) {
        res.statusCode = 200;
        res.end("No favorite to delete");
      }
      var index = favorite.dishes.indexOf(req.params.dishId);
      if (index > -1) {
        favorite.dishes.splice(index, 1);
        favorite
          .save()
          .then(
            (resp) => {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.json(resp);
            },
            (err) => next(err)
          )
          .catch((err) => next(err));
      }
    });
  });

module.exports = favoriteRouter;
