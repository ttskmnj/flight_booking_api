# flight_booking_api
## Description
This is a JSON API backend for the Airline Booking System Web Application. There are two types of users: Passengers and Airlines. Airlines can add and remove flights from the system, while Passengers can search for flights between two destinations on desired dates and create bookings.
It is a TypeScript Express application that uses Prisma as an ORM and Postgres as the database.

## Prerequisites
You will need Node.js, and Docker Compose installed on your machine

## Installation
1. clone the repository
```
$ git clone git@github.com:ttskmnj/flight_booking_api.git
```
2. change directory to repository root directory
```
$ cd flight_booking_api
```
3. install modules
```
$ npm install
```
4. download IATA Airport code

  - create `data` directory in repository root directory
    ```
    $ mkdir data
    ```
  - download `airport-codes_json.json` to `data` directory.<br>
    download json file from [here](https://datahub.io/core/airport-codes/r/airport-codes.json)

## prepare `.env`
You will need to create a `.env` file in the root of the reposiotory.
```
POSTGRESDB_USER=<POSTGRES USER>
POSTGRESDB_ROOT_PASSWORD=<POSTGRES PASSWORD>
POSTGRESDB_DATABASE=<POSTGRES DATABASE>
DATABASE_URL=postgresql://<POSTGRES USER>:<POSTGRES PASSWORD>@<POSTGRES URL>:<POSTGRES PORT>/<POSTGRES DATABASE>?schema=public
SECRET=<JWT SECRET>
```
*if you run it with Docker Compose, please choose `pg` as `<POSTGRES URL>` and `5432` as `<POSTGRES PORT>` since it is set in `docker-compose.yml`*

## Run API locally

#### use Postgres docker image
you can use the official postgres docker image to run a local postgres instance.
```
$ docker run --name local-pg -e POSTGRES_PASSWORD='<POSTGRES PASSWORD>' -e POSTGRES_USER='<POSTGRES USER>' -e POSTGRES_DB='<POSTGRES DATABASE>' -p <POSTGRES PORT>:5432 -d postgres:12
```
#### migrate db
```
$ npx prisma migrate deploy
```

#### seed db
```
$ npx prisma migrate dev --name init
```
seed script will add IATA aiport code to `Airport` table and add following 2 users to `User` table to test API.
| username | code (IATA 2 letter airline code)|
|----------|----------------------------------|
|Wizz Air  | W6                               |
|Ryanair   | FR                               |



#### start API locally
run following commands in the root of the reposiotory
```
$ npm run build
$ npm start
```

## Run API on Docker Compose

#### Create and start containers
run following command in the root of the reposiotory
```
$ docker-compose up -d
```
if it is the first time, it will build container, so it might going to take some time.
*you might need `sudo` in front of the command. it depends on your docker setting*

#### check containers are up
if containers run properly, it will show something as below
```
$ docker ps
CONTAINER ID   IMAGE                    COMMAND                  CREATED          STATUS                    PORTS                                       NAMES
940332273fd0   flight_booking_api_api   "docker-entrypoint.s…"   15 seconds ago   Up 3 seconds              0.0.0.0:3001->3000/tcp, :::3001->3000/tcp   flight_booking_api-api-1
fa4bba1bbe5c   postgres                 "docker-entrypoint.s…"   15 seconds ago   Up 14 seconds (healthy)   0.0.0.0:5433->5432/tcp, :::5433->5432/tcp   flight_booking_api-pg-1
```
*make sure there is `postgres` and `api` cointainers are running.*

#### stop containers
you can stop containers with following command
```
$ docker-compose down
```


## Try API endpoints
There is only airport and user data is set in DB by seed script. To test flight reservation you must first add the flights then you can book a flight.

------------------------------------------------------------------------------------------
<summary><code>POST</code> <code><b>/login</b></code> <code>(login to get TOKEN)</code></summary>
To add/delete flight, you need to be autheticated. So let's start by login.

Login endpoint receive `username` and `password` via POST method and return `token` in json. `token` will be expired after 10minutes.

##### users
there is 2 users are added by seed script. please use these username and password to login.
|username|password|
|--------|--------|
|"Wizz Air"|"wizzair"|
|"Ryanair|"ryanair"|

**yes. they are my favourite airlines*

##### parameters
|name|type|format|description|
|----|----|------|-----------|
|username|string||user name|
|password|string||password|

#### sample request 
```
$ curl -X POST http://localhost:3000/login
   -H 'Content-Type: application/json'
   -d '{"username":"Wizz Air","password":"wizzair"}'
```

#### response
```json
# success
# status: 200
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IldpenogQWlyIiwiY29kZSI6Ilc2IiwiaWF0IjoxNzAxNjk3NTIzLCJleHAiOjE3MDE2OTgxMjN9.k5-9DAhE0AtxZEuiF8wwyIWQnkeHvU7OsJfMgRCTTiU"
}

# error: invalid username or password
{
  "error":"invalid username or password"
}

```
------------------------------------------------------------------------------------------
### flight endpoint
you add,search and delete flight at this endpoint. you need to be autheticated to add and delete flight.
<summary><code>POST</code> <code><b>/flight</b></code> <code>(add flight :TOKEN authentication needed)</code></summary>

To add flight you need to send 3-letter airport origin and destination, date, flight number, and the 
number of seats via POST method. 

##### POST parameters
|name|type|format|description|
|----|----|------|-----------|
|origin|string||3-letter airport origin|
|dest|string||3-letter airport destination|
|date|datetime|YYYY-MM-DDThh:mm:ss.mssZ|flight datetime|
|numSeat|number||number of seat|

##### header
|name|type|
|----|----|
|Authorization|Bearer Token|

#### sample request 
```
$ curl -X POST http://localhost:3000/flight
   -H "Content-Type: application/json"
   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IldpenogQWlyIiwiY29kZSI6Ilc2IiwiaWF0IjoxNzAxNjk4MzY3LCJleHAiOjE3MDE2OTg5Njd9.H3wjgBOR-5f3uviqO3RfDPJ7cKmSGm_Ny-5YAAANz2E"
   -d '{ "origin": "NUP", "dest":"WLR", "date": "2023-11-30T12:34:32.000Z", "numSeat": 5}'
```

#### response
```
# success
# status: 200
{
  "id":1,
  "flightNum":"W60",
  "numSeat":5,
  "originId":8,
  "destId":7,
  "airlineId":1,
  "date":"2023-11-30T12:34:32.000Z"
}

# error: date format is invalid
# status: 401
{
  "error":"invalid date"
}

# error: airport origin or destination is wrong
# status: 401
{
  "error":"invalid origin or destination"
}

# error: failed to add flight to db
# status: 500
{ 
  error: `failed to create flight` 
}

```


<summary><code>DELETE</code> <code><b>/flight</b></code> <code>(delete flight :TOKEN authentication needed)</code></summary>

To delete flight you need to send flight number via DELETE method.

##### POST parameters
|name|type|format|description|
|----|----|------|-----------|
|flightNum|string||3-letter airport origin|

##### header
|name|type|
|----|----|
|Authorization|Bearer Token|


#### sample request 
```
$ curl -X DELETE http://localhost:3000/flight
   -H "Content-Type: application/json"
   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IldpenogQWlyIiwiY29kZSI6Ilc2IiwiaWF0IjoxNzAxNzAyMzg2LCJleHAiOjE3MDE3MDI5ODZ9.gsoTboX5_9XPathj25aKpkP7PmteQ8i2aq9SeJYlMnQ"
   -d '{ "flightNum": "W60"}'
```

#### response
```
# success
# status: 200
{
  "message":"flight number: W60 is deleted"
}

# error: try to delete other airline's flight
# status: 400
{
  error: "cannot delete other airline's flight",
}

# error: failed to delete db record
# status: 500
{ 
  error: `failed to delete flight number: ${flightNum}`
}

```


<summary><code>GET</code> <code><b>/flight/:origin/:dest/:date</b></code> <code>(search flight)</code></summary>


To search flight you need to send airport origin and destination, date via GET method. It will return all flights match searching criteria.

##### GET parameters
|name|type|format|description|
|----|----|------|-----------|
|origin|string||3-letter airport origin|
|dest|string||3-letter airport destination|
|date|date|YYYY-MM-DD|date of flight|

#### sample request 
```
$ curl -X GEY http://localhost:3000/flight/NUP/WLR/2023-11-30
   -H "Content-Type: application/json"
```

#### response
```
# success
# status: 200
[
  {
    "id":2,
    "flightNum":"W60",
    "numSeat":5,
    "originId":8,
    "destId":7,
    "airlineId":1,
    "date":"2023-11-30T12:34:32.000Z"
  },
  {
    "id":3,
    "flightNum":"W61",
    "numSeat":59,
    "originId":5,
    "destId":2,
    "airlineId":1,
    "date":"2023-11-30T12:45:32.000Z"
  }
]

# error: date format is invalid
# status: 401
{
  "error":"invalid date"
}

# error: airport origin or destination is wrong
# status: 401
{
  "error":"invalid origin or destination"
}
```
------------------------------------------------------------------------------------------
### booking endpoint
you add and search booking at this endpoint.
<summary><code>POST</code> <code><b>/booking</b></code> <code>(add booking )</code></summary>

To add booking you need to send flight ID, firstname, lastname via POST method. 

##### POST parameters
|name|type|format|description|
|----|----|------|-----------|
|flightId|number||flight id|
|firstName|string||firstname|
|lastName|string||lastname|

#### sample request 
```
$ curl -X POST http://localhost:3000/booking
   -H "Content-Type: application/json"
   -d '{ "flightId": 2, "firstName":"tatsuki", "lastName":"monji"}'
```

#### response
```
# success
# status: 200
{
  "id":1,
  "confirmNum":852091,
  "firstName":"tatsuki",
  "lastName":"monji",
  "flightId":2
}

# error: flight ID doesn not found
# status: 400
{ 
  error: `flight id: 24 not found` 
}


# error: flight is fully booked
# status: 400
{ 
  error: `flight id: 2 is fully booked` 
}

# error: failed generate confirmation numnber
# status:500
{
  error: `failed to book flight 2. failed to generate confirmation numnber`,
}
```
<summary><code>GET</code> <code><b>/booking/:confirmNum/:lastName/</b></code> <code>(search booking )</code></summary>

To search booking you need to send Confirmation number and lastname via GET method. 

##### GET parameters
|name|type|format|description|
|----|----|------|-----------|
|confirmNum|number||6 letter Confirmation Number|
|lastName|string||lastname|

#### sample request 
```
$ curl -X GET http://localhost:3000/booking/552837/mnji
   -H "Content-Type: application/json"
```

#### response
```
# success 
# status: 200
{
  "confirmNum":552837,
  "firstName":"tatsk",
  "lastName":"mnji",
  "flight":{
    "id":2,
    "flightNum":"W60",
    "numSeat":5,
    "originId":8,
    "destId":7,
    "airlineId":1,
    "date":"2023-11-30T12:34:32.000Z"
  }
}

# error: Confirmation Number is not number
# status: 400
{
  error: "Invalid Confirmation Number" 
}

# error: Invalid Confirmation Number or last Name
# status: 400
{ 
  error: "Invalid Confirmation Number or last Name" 
}

```