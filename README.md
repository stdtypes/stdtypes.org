# stdtypes.org

Type definitions, implementations and visualizations for common data structures and multiple programming languages. It serves as a library for IDEs and similar software.

For now, there are three environments defined:

## [std::](https://github.com/stdtypes/stdtypes.org/tree/master/std)

The _Standard-Types_ collection is a list of common data structures like scientific
types (temperature or geolocation) or user management types (like user or person).


## [go](https://github.com/stdtypes/stdtypes.org/tree/master/std)

The _Go_ collection lists packeges from the programming language [go](https://golang.org/).
Have a look at the offical go [packages library](https://golang.org/pkg/).
Our list is not complete yet and does only include go core packages!

## JavaScript

A JavaScript types library is under development...


-------

# Type definitions

A type definition describes a data type, a package (like go pacakges or npm pacakges) or any other API type.

In this project, a type definition corresponds with a single `.yaml` file.

Here are a few examples of definitions and what a implementation could look like with JavaScript.


```yaml
# type or package name
name: geolocation              
# full name
desc: Geographical location    
# some tags that describe this type
tags: [ Scientific, Location ]
# a documention (markdown)
doc: A _position_ on earth, defined by latitude and longitude.
# a version number
version: 1.0.0
# stable or experimental
stability: stable

# all symbols exported by this type
symbols:

  - name: Latitude # property
    doc: Position Latitude.
    type: float

  - name: Longitude # property
    doc: Position Longitude.
    type: float

  - name: DistanceTo # method
    doc: Distance between two points along the earth surface in *km*.
    params:
      # single parameter
      - name: other
        type: geolocation
    returns:
      # single return value
      - name: dist
        type: float

```

For more on this type, look at [std/scientific/geolocation.yaml](https://github.com/stdtypes/stdtypes.org/blob/master/std/scientific/geolocation.yaml) and the result at [stdtypes.org](https://localhost/#scientific/geolocation).

This definitions tells us

- there is a public property called *Latitude* with type *float*,
- there is a public property called *Longitude* with type *float*,
- there is a public property method *DistanceTo* with one parameter (type geolocation) and one return value (type float).

An example class definition in C++ looks like

```c++
class Geolocation {
  public:
    float Latitude, Longitude;
    float DistanceTo(Geolocation);
}
```

# Type Visualizations

under development..


-------

# How To...

### ... run this library on your local machine:

Just download this repository using the git command line tool or click 'Open in Desktop'.

```
$ git clone https://github.com/stdtypes/stdtypes.org.git
```

You will need [Node.js](https://nodejs.org/en/) to build some essential files.

First, convert all `.yaml` type definitions to `.json` files that are easy machine readable and for better use with the website.

```
$ npm run yaml2json
```

To run a simple webserver on your machine, use the simple http-server that comes with this project.

```
$ npm run live
```

The webserver will be available at `http://localhost`.


### ... create new type definitions?

Feel free to create new `.yaml` type definitions and test them with this repository running at your local machine. Have a look at the above topic on how to download and execute this project.

Remember to run `yaml2json` to update the JSON files with the new type!

We would like to see your pullrequests with new usefull type-definitions and improvements on existing ones!
