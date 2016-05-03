// config/auth.js
// expose our config directly to our application using module.exports
module.exports = {
    'googleAuth' : {
        'clientID'      : '813433863993-dn497fmkof7a11h31rt6n7e1tubm2t68.apps.googleusercontent.com',
        'clientSecret'  : 'gkBwdU3x-Lh_fG5b_juOVsn4',
        'callbackURL'   : 'http://localhost:8080/auth/google/callback',
        'proxy': true
    }

};