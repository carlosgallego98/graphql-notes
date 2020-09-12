const jwt = require("jsonwebtoken");

module.exports = (req, res, next) =>{
    const authHeader = req.get("authorization");
    if(!authHeader){
        req.authUser = false;
        return next();
    }
    const token = authHeader.split(' ')[1];
    if(!token || token === ''){
        req.authUser = false;
        return next();
    }

    let userToken
    userToken = jwt.verify(token,"HolaMundoSoyPro");

    if(!userToken){
        req.authUser = false;
        return next();
    }

    req.authUser = true;
    req.userId = userToken.userId
    next()
    
}