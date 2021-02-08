//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/toDoListDB", {useNewUrlParser: true}); //connect or create toDoListDB in mongo

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema); //will create items collecition, convert Item to items with lodash

const item1 = new Item ({ //create new doc, according to the Item model
  name: "Welcome to your to do list!"
})

const item2 = new Item ({
  name: "Hit the + button to add a new item."
})

const item3 = new Item ({
  name: "<-- Hit this to delete an item."
})

const defaultItems = [item1, item2, item3];

//listSchema, for the express route parameter
const listSchema = {
  name: String,
  items: [itemsSchema]
  //array of items Schema based items
};

//for the express route parameter
const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

   Item.find({},function(err, foundItems){ //no query, returns an array of results found

   if(foundItems.length == 0){ //to prevent duplication of the 3 default items, only add once, when its empty
     Item.insertMany(defaultItems, function(err){
       if (err){
         console.log(err);
       } else {
         console.log("successfully inserted many ");
       }
     });
     res.redirect("/"); //then go to else block, updating rendered list
   } else{
     res.render("list", {listTitle: "Today", newListItems: foundItems});
   }
  })
});

app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName); //converts first letter to upper case, others lower case
  //set customListName according to the route parameter
  List.findOne({name: customListName}, function(err,foundList){ //finding in the specified collection of List model
    if (!err){
      if (!foundList){ //if this list name wasn't found in the collection
        //wont create new list if a list with same name already exist, wont have duplicate lists
        //Create a new list (only if there isn't a list with the same name already in the collection)
        const list = new List ({
          name: customListName, //parameter inserted
          items: defaultItems
        })
        // list.save();
        // res.redirect("/" + customListName); //will go to else, then render new customListName, updating the list title

        list.save(function(err, result) { // Log the result parameter to the console to review it
          res.redirect("/" + customListName);
        });
      }
      //making sure that save first, then only redirect
      //to prevent duplications in the mongodb database

      else {
        //Show an existing list

        res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
      }
    }
  })


});


app.post("/", function(req, res){

  const itemName = req.body.newItem; //user input
  const listName = req.body.list; //value of the button that submit

  const item = new Item({
    name : itemName
  });

  //checking which list the post submit post req came from

  if (listName === "Today"){ //default list
    //instead of insert, can use a shortcut

    // item.save(); //will save this doc into our collection according to model
    // res.redirect("/"); //to display the newly added item name

    item.save(function(err, result) {
      res.redirect("/");
    });

  } else { //custom list
    List.findOne({name: listName}, function(err,foundList){
      foundList.items.push(item);
      // foundList.save();
      // res.redirect("/" + listName);

      foundList.save(function(err, result) { // Log the result parameter to the console to review it
       res.redirect("/" + listName);
     });
    })
  }

});

app.post("/delete", function(req,res){
  const checkedItemId = (req.body.checkbox); //accessing the value of checkbox with name checkbox
  const listName = req.body.listName; //value of the input with name listName

    if(listName === "Today"){
      Item.findByIdAndRemove(checkedItemId, function(err){
        //function(err) is the callback function, need it to find and remove, even if u dw to know the error
        if (err){
          console.log(err);
        } else{
          console.log("successfully deleted the item");
          res.redirect("/"); //updating the rendering new list after delete
        }
      })
    } else { //delete request from a custom list
      //get the document by name, then access its array (items), then pull the element (item in array) with id of...
      //every element in the array, has a different object id
      List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
        if (!err){
          res.redirect("/" + listName);
        }
      });
    }


})

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
