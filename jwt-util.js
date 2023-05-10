import jwt from "jsonwebtoken";

const MY_DEFAULT_JWT_ISSUER="https://www.d-defrance.fr/tp" ;
const MY_DEFAULT_JWT_SECRECT="MyJWTSuperSecretKey" ;
const MY_DEFAULT_JWT_EXPIRATION=2*60*60 ; //2heures


function buildJwtToken(userid , username , scopesString , firstName, lastName, email ,
    jwtSecret  = MY_DEFAULT_JWT_SECRECT ,
    jwtExpirationInS  = MY_DEFAULT_JWT_EXPIRATION) {
    //exemples: jwtExpirationInS=60*05= 300s pour 5minutes
    // jwtExpirationInS=60*15= 900s pour 15minutes
    // jwtExpirationInS=60*30=1800s pour 30minutes
    // jwtExpirationInS=60*60=3600s pour 60minutes
    // jwtExpirationInS=60*120=7200s pour 120minutes
    // usernameOrId="user1"
    // jwtSecret="MyJWTSuperSecretKey"
    // roleNames="user,admin"
let jwtToken  = null;


let claim = {
    sub:userid,
    preferred_username: username,
    scope : scopesString,
    given_name: firstName,
    family_name:lastName,
    email:email
};
let options = {
    issuer : MY_DEFAULT_JWT_ISSUER,
    expiresIn: jwtExpirationInS
};
// sign with default (HMAC SHA256)
jwtToken = jwt.sign(claim, jwtSecret , options);
return jwtToken;
}

function extractSubjectWithScopesClaimFromJwt(jwtToken, 
             jwtSecret= MY_DEFAULT_JWT_SECRECT) /*: Promise<SubjectWithRolesClaim> */{
    return new Promise((resolve,reject) => {
        jwt.verify(jwtToken, jwtSecret, (err, decoded) => {
            const claim = decoded ;
            if(err==null){
                resolve(claim);
            }
            else{
                reject("wrong token " + err);
            }
        });

    });
 }

 function extractSubjectWithScopesClaimFromJwtInAuthorizationHeader(
     authorizationHeader) /*: Promise<SubjectWithRolesClaim>*/{ 
       return new Promise((resolve,reject) => {
          if(authorizationHeader!=null ){
              if(authorizationHeader.startsWith("Bearer")){
                var token = authorizationHeader.substring(7);
                //console.log("extracted (jwt) token:" + token);
                if(token != null && token.length>0){
                    extractSubjectWithScopesClaimFromJwt(token)
                    .then((claim)=>{resolve(claim);})
                    .catch((err)=>{reject(err);});
                }
                else
                    reject("no or empty token");
                }
            else
            reject("no Bearer token in authorizationHeader");
        } 
        else
        reject("no authorizationHeader");
    });//end of new Promise(() => { });
}

export default { buildJwtToken , extractSubjectWithScopesClaimFromJwt , extractSubjectWithScopesClaimFromJwtInAuthorizationHeader  }