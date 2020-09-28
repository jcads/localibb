const BookInstance = require('../models/bookinstance');
const Book = require("../models/book");

const validator = require("express-validator");
const async = require("async");


// Display list of all BookInstances.
exports.bookinstance_list = function(req, res) {
    BookInstance.find()
    .populate('book')
    .exec(function (err, list_bookinstances) {
      if (err) { return next(err); }
      // Successful, so render
      res.render('bookinstance_list', { title: 'Book Instance List', bookinstance_list: list_bookinstances });
    });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function(req, res) {
    BookInstance.findById(req.params.id).
        populate("book").
        exec((err, bookinstance) => {
            if (err) return next(err);
            if (bookinstance == null) {
                let err = new Error("Book copy not found");
                err.status = 404;
                return next(err);
            }
            res.render("bookinstance_detail", {title: 'Copy: '+bookinstance.book.title, bookinstance:  bookinstance, hideDeleteForm: "hidden"});
        })
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function(req, res, next) {
    Book.find({},'title')
    .exec(function (err, books) {
      if (err) { return next(err); }
      // Successful, so render.
      res.render('bookinstance_form', {title: 'Create BookInstance', book_list: books});
    });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
    // Validate fields.
    validator.body('book', 'Book must be specified').trim().isLength({ min: 1 }).escape(),
    validator.body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }).escape(),
    validator.body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601().toDate(),
    validator.body('status').trim().escape(),
    
    // Sanitize fields.
    /*sanitizeBody('book').escape(),
    sanitizeBody('imprint').escape(),
    sanitizeBody('status').trim().escape(),
    sanitizeBody('due_back').toDate(),*/
    
    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validator.validationResult(req);

        // Create a BookInstance object with escaped and trimmed data.
        var bookinstance = new BookInstance(
          { book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back
           });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values and error messages.
            Book.find({},'title')
                .exec(function (err, books) {
                    if (err) { return next(err); }
                    // Successful, so render.
                    res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books, selected_book: bookinstance.book._id , errors: errors.array(), bookinstance: bookinstance });
            });
            return;
        }
        else {
            // Data from form is valid.
            bookinstance.save(function (err) {
                if (err) { return next(err); }
                   // Successful - redirect to new record.
                   res.redirect(bookinstance.url);
                });
        }
    }  
];
// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function(req, res, next) {
     BookInstance.findById(req.params.id).
        populate("book").
        exec((err, bookinstance) => {
            if (err) return next(err);
            if (bookinstance == null) {
                let err = new Error("Book copy not found");
                err.status = 404;
                return next(err);
            }
            res.render("bookinstance_detail", {title: 'Copy: '+bookinstance.book.title, bookinstance:  bookinstance, hidden: "hidden"});
        })
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function(req, res, next) {
    console.log(req.body.bookinstanceid);
    BookInstance.findByIdAndRemove(req.body.bookinstanceid, err => {
       if (err) return next(err);

       res.redirect("/catalog/bookinstances");
    });
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function(req, res, next) {
    async.parallel({
        books: callback => {
            Book.find({}, "title").exec(callback);
        },
        bookinstance: callback => {
            BookInstance.findById(req.params.id).exec(callback);
        }
    }, (err, results) => {
        if (err) return next(err);
        res.render("bookinstance_form", {title: "Update BookInstance", book_list: results.books, bookinstance: results.bookinstance});
    });
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [

    // Validate fields.
    validator.body('book', 'Book must be specified').trim().isLength({ min: 1 }).escape(),
    validator.body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }).escape(),
    validator.body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601().toDate(),
    validator.body('status').trim().escape(),
    
    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validator.validationResult(req);

        // Create a BookInstance object with escaped and trimmed data.
        var bookinstance = new BookInstance(
          { book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
            _id: req.params.id
           });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values and error messages.
            Book.find({},'title')
                .exec(function (err, books) {
                    if (err) { return next(err); }
                    // Successful, so render.
                    res.render('bookinstance_form', { title: 'Update BookInstance', book_list: books, selected_book: bookinstance.book._id , errors: errors.array(), bookinstance: bookinstance });
            });
            return;
        }
        else {
            // Data from form is valid.
            BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, (err, updatedBookInstance) => {
                if (err) return next(err);
                res.redirect("/catalog/bookinstance/" + req.params.id);
            });
        }
    }  
];
