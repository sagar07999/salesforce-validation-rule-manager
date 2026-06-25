import "./App.css";
import React, { useState } from "react";

function App() {
  const [rules, setRules] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");

  const getValidationRules = async () => {
    try {
      const response = await fetch(
        "https://salesforce-validation-rule-manager-h42q.onrender.com/validation-rules"
      );

      const data = await response.json();
      setRules(data);
    } catch (error) {
      console.log(error);
    }
  };

  const activeCount = rules.filter(rule => rule.Active).length;
const inactiveCount = rules.length - activeCount;

const uniqueObjects = [
  ...new Set(
    rules.map(
      rule => rule.EntityDefinition?.QualifiedApiName
    )
  )
].length;

  const loginToSalesforce = () => {
    window.location.href =
      "https://salesforce-validation-rule-manager-h42q.onrender.com/login";
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
        "https://salesforce-validation-rule-manager-h42q.onrender.com/deploy",
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

  const filteredRules = rules.filter((rule) =>
  rule.ValidationName
    ?.toLowerCase()
    .includes(searchTerm.toLowerCase()) ||

  rule.EntityDefinition?.QualifiedApiName
    ?.toLowerCase()
    .includes(searchTerm.toLowerCase())
);

  return (
    <div className="app">

  <div className="header">
    <div className="title">
      <h1>Salesforce Validation Rule Manager</h1>
      <p>Manage, Enable, Disable and Deploy Validation Rules</p>
    </div>

    <div className="connected">
      ● Connected
    </div>
  </div>

  <div className="button-group">

    <button className="btn blue" onClick={loginToSalesforce}>
      Login to Salesforce
    </button>

    <button className="btn blue" onClick={getValidationRules}>
      Get Validation Rules
    </button>

    <button className="btn green" onClick={enableAllRules}>
      Enable All
    </button>

    <button className="btn red" onClick={disableAllRules}>
      Disable All
    </button>

    <button className="btn purple" onClick={deployChanges}>
      Deploy Changes
    </button>

  </div>
  <div className="search-container">
  <input
    type="text"
    placeholder="Search by Rule Name or Object Name..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="search-input"
  />
</div>

  <div className="cards">

    <div className="card">
      <h2>{rules.length}</h2>
      <p>Total Rules</p>
    </div>

    <div className="card">
      <h2>{activeCount}</h2>
      <p>Active Rules</p>
    </div>

    <div className="card">
      <h2>{inactiveCount}</h2>
      <p>Inactive Rules</p>
    </div>

    <div className="card">
      <h2>{uniqueObjects}</h2>
      <p>Objects</p>
    </div>

  </div>
  <div className="results-count">
  Showing {filteredRules.length} of {rules.length} Rules
</div>

  <div className="table-container">

    <table>

      <thead className="table-header">
        <tr>
          <th>Validation Rule</th>
          <th>Object</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>

      <tbody>

        {filteredRules.map((rule) => (
          <tr key={rule.Id}>

            <td>{rule.ValidationName}</td>

            <td>
              {rule.EntityDefinition?.QualifiedApiName}
            </td>

            <td>
              <span
                className={
                  rule.Active
                    ? "active"
                    : "inactive"
                }
              >
                {rule.Active
                  ? "Active"
                  : "Inactive"}
              </span>
            </td>

            <td>
              <button
                className={`toggle-btn ${
                  rule.Active
                    ? "toggle-on"
                    : "toggle-off"
                }`}
                onClick={() =>
                  toggleRule(rule.Id)
                }
              >
                {rule.Active ? "ON" : "OFF"}
              </button>
            </td>

          </tr>
        ))}

      </tbody>

    </table>

  </div>

</div>);
}

export default App;