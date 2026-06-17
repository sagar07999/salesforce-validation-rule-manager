const jsforce = require("jsforce");
const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Backend Running");
});

app.get("/login", (req, res) => {
    const authUrl =
        `${process.env.SF_LOGIN_URL}/services/oauth2/authorize` +
        `?response_type=code` +
        `&client_id=${process.env.SF_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(process.env.SF_REDIRECT_URI)}`;

    console.log("REDIRECT URI =", process.env.SF_REDIRECT_URI);
    console.log("AUTH URL =", authUrl);

    res.redirect(authUrl);
});

app.get("/callback", async(req, res) => {
    const code = req.query.code;

    try {
        const response = await axios.post(
            `${process.env.SF_LOGIN_URL}/services/oauth2/token`,
            null, {
                params: {
                    grant_type: "authorization_code",
                    client_id: process.env.SF_CLIENT_ID,
                    client_secret: process.env.SF_CLIENT_SECRET,
                    redirect_uri: process.env.SF_REDIRECT_URI,
                    code: code,
                },
            }
        );

        global.accessToken = response.data.access_token;
        global.instanceUrl = response.data.instance_url;

        console.log("Logged in successfully");
        console.log("INSTANCE URL =", global.instanceUrl);
        console.log("ACCESS TOKEN =", global.accessToken ? "Present" : "Missing");

        res.redirect("http://localhost:3000");

    } catch (error) {
        if (error.response) {
            console.log(error.response.data);
        } else {
            console.log(error.message);
        }
        res.send("OAuth Failed");
    }
});

app.get("/validation-rules", async(req, res) => {
    try {
        const query =
            "SELECT Id, ValidationName, Active, EntityDefinition.QualifiedApiName FROM ValidationRule";

        const response = await axios.get(
            `${global.instanceUrl}/services/data/v64.0/tooling/query`, {
                headers: {
                    Authorization: `Bearer ${global.accessToken}`
                },
                params: {
                    q: query
                }
            }
        );

        res.json(response.data.records);

    } catch (error) {
        if (error.response) {
            console.log(error.response.data);
        } else {
            console.log(error.message);
        }
        res.status(500).send("Error fetching validation rules");
    }
});

app.get("/rule/:id", async (req, res) => {
    try {

        console.log("===== RULE API CALLED =====");
        console.log("INSTANCE URL =", global.instanceUrl);
        console.log("ACCESS TOKEN =", global.accessToken ? "Present" : "Missing");

        if (!global.accessToken || !global.instanceUrl) {
            return res.status(401).send("Please login first");
        }

        const query = `
SELECT Id,
       ValidationName,
       Active,
       EntityDefinition.QualifiedApiName
FROM ValidationRule
WHERE Id='${req.params.id}'
`;

        console.log("QUERY =", query);

        const response = await axios.get(
            `${global.instanceUrl}/services/data/v64.0/tooling/query`,
            {
                headers: {
                    Authorization: `Bearer ${global.accessToken}`
                },
                params: {
                    q: query
                }
            }
        );

        console.log("SUCCESS");

        res.json(response.data.records[0]);

    } catch (error) {

        console.log("===== FULL ERROR =====");

        if (error.response) {
            console.log(JSON.stringify(error.response.data, null, 2));
        } else {
            console.log(error.message);
        }

        res.status(500).send("Error");
    }
});
app.post("/toggle-rule/:id", async (req, res) => {
    try {

        const conn = new jsforce.Connection({
            instanceUrl: global.instanceUrl,
            accessToken: global.accessToken
        });

        const ruleId = req.params.id;

        const result = await conn.tooling.query(`
            SELECT Id,
                   ValidationName,
                   Active,
                   Metadata
            FROM ValidationRule
            WHERE Id='${ruleId}'
        `);

        const rule = result.records[0];

        rule.Metadata.active = !rule.Metadata.active;

        console.log(
            "Changing Active from",
            rule.Active,
            "to",
            rule.Metadata.active
        );

        const updateResult =
            await conn.tooling.sobject("ValidationRule")
            .update({
                Id: ruleId,
                Metadata: rule.Metadata
            });

        console.log(updateResult);

        res.json({
            success: true,
            updateResult
        });

    } catch (err) {

        console.log("UPDATE ERROR");
        console.log(err);

        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

app.post("/toggle-all-rules", async (req, res) => {
    try {

        const conn = new jsforce.Connection({
            instanceUrl: global.instanceUrl,
            accessToken: global.accessToken
        });
        console.log("INSTANCE URL =", global.instanceUrl);
console.log(
    "ACCESS TOKEN =",
    global.accessToken ? "Present" : "Missing"
);
        const result = await conn.tooling.query(`
    SELECT Id
    FROM ValidationRule
`);

for (const r of result.records) {

    const singleRule = await conn.tooling.query(`
        SELECT Id,
               ValidationName,
               Active,
               Metadata
        FROM ValidationRule
        WHERE Id='${r.Id}'
    `);

    const rule = singleRule.records[0];

    console.log(
        "Changing",
        rule.ValidationName,
        "from",
        rule.Active,
        "to",
        !rule.Active
    );

    rule.Metadata.active = !rule.Metadata.active;

    await conn.tooling
        .sobject("ValidationRule")
        .update({
            Id: rule.Id,
            Metadata: rule.Metadata
        });
}

        res.json({
            success: true
        });

    } catch (err) {

        console.log("TOGGLE ALL ERROR");
        console.log(err);

        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

app.post("/deploy", async (req, res) => {

    try {

        const conn = new jsforce.Connection({
            instanceUrl: global.instanceUrl,
            accessToken: global.accessToken
        });

        const rules = req.body;

        for (const rule of rules) {

            const result = await conn.tooling.query(`
                SELECT Id,
                       Metadata
                FROM ValidationRule
                WHERE Id='${rule.Id}'
            `);

            const metadata =
                result.records[0].Metadata;

            metadata.active = rule.Active;

            await conn.tooling
                .sobject("ValidationRule")
                .update({
                    Id: rule.Id,
                    Metadata: metadata
                });
        }

        res.json({
            success: true
        });

    } catch (err) {

        console.log("DEPLOY ERROR");
        console.log(err);

        res.status(500).json({
            success: false
        });
    }
});

app.listen(5000, () => {
    console.log("Server running on port 5000");
});