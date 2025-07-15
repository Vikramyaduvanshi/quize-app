var jwt = require('jsonwebtoken');

function quizmiddle(...allowedrole){
  return (req, res, next) => {
    try {
      let token = req.headers.authorization?.split(" ")[1];

      if (!token) {
        return res.status(401).json({ message: "Access token missing" });
      }

      let decoded = jwt.verify(token, 'shhhhh');

      if (decoded && allowedrole.includes(decoded.role)) {
        req.user = decoded.userId;
        next();
      } else {
        return res.status(403).json({ message: 'Not allowed for this user' });
      }
    } catch (e) {

      if (e.message === "jwt expired") {
        let refreshtoken = req.headers.refreshtoken?.split(" ")[1];

        if (!refreshtoken) {
          return res.status(401).json({ message: "Refresh token missing" });
        }

        try {
          let refreshdecoded = jwt.verify(refreshtoken, 'shhhhh');

          // Check refresh token role
          if (!allowedrole.includes(refreshdecoded.role)) {
            return res.status(403).json({ message: "Not allowed for this user (refresh)" });
          }

          let newaccessToken = jwt.sign(
            { userId: refreshdecoded.userId, role: refreshdecoded.role },
            'shhhhh',
            { expiresIn: 300 }
          );

          req.user = refreshdecoded.userId;
          res.setHeader("new-access-token", newaccessToken);
          next();

        } catch (e) {
          return res.status(401).json({ message: "Invalid refresh token", error: e.message });
        }

      } else {
        return res.status(401).json({ message: "Login failed", error: e.message });
      }
    }
  };
}

module.exports = quizmiddle;
