import React, { useState } from "react";

function App() {
  const [rules, setRules] = useState([]);

  const getValidationRules = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/validation-rules"
      );

      const data = await response.json();
      setRules(data);
    } catch (error) {
      console.log(error);
    }
  };

  const loginToSalesforce = () => {
    window.location.href = "http://localhost:5000/login";
  };

const toggleRule = (id) => {

  const updatedRules = rules.map((rule) => {

    if (rule.Id === id) {
      return {
        ...rule,
        Active: !rule.Active
      };
    }

    return rule;
  });

  setRules(updatedRules);
};

const enableAllRules = () => {

  const updatedRules = rules.map((rule) => ({
    ...rule,
    Active: true
  }));

  setRules(updatedRules);
};

const disableAllRules = () => {

  const updatedRules = rules.map((rule) => ({
    ...rule,
    Active: false
  }));

  setRules(updatedRules);
};

const deployChanges = async () => {

  try {

    const response = await fetch(
      "http://localhost:5000/deploy",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(rules)
      }
    );

    const data = await response.json();

    if (data.success) {
      alert("Changes Deployed Successfully");

      getValidationRules();
    } else {
      alert("Deployment Failed");
    }

  } catch (error) {

    console.log(error);

    alert("Deployment Failed");
  }
};

  return (
    <div style={{ padding: "20px" }}>
      <h1>Salesforce Validation Rule Manager</h1>
      <button onClick={loginToSalesforce}>
  Login to Salesforce
</button>

{" "}

<button onClick={getValidationRules}>
  Get Validation Rules
</button>

{" "}

      <button onClick={enableAllRules}>
  Enable All
</button>

{" "}

<button onClick={disableAllRules}>
  Disable All
</button>

{" "}

<button onClick={deployChanges}>
  Deploy Changes
</button>

      <br />
      <br />

      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Validation Rule</th>
            <th>Object</th>
            <th>Status</th>
<th>Action</th>
          </tr>
        </thead>

        <tbody>
          {rules.map((rule) => (
            <tr key={rule.Id}>
              <td>{rule.ValidationName}</td>
              <td>{rule.EntityDefinition?.QualifiedApiName}</td>
              <td>{rule.Active ? "Active" : "Inactive"}</td>
              <td>
  <button
  onClick={() => toggleRule(rule.Id)}
>
  {rule.Active ? "ON" : "OFF"}
</button>
</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;