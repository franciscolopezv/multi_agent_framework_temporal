db = db.getSiblingDB('flow-orchestration');

db.flows.insertOne({
    "_id": "provision_app:v1",
    "name": "provision_app",
    "version": "v1",
    "steps": [
      {
        "agent": "app_designer",
        "activityName": "designApp",
        "inputKey": "initialRequest"
      },
      {
        "agent": "terraform",
        "activityName": "generateTerraform",
        "input": {
             "idea": "{{ initialRequest.idea }}",
            "design": "{{ app_designer.output.result }}"
        }
      },
      {
        "parallel": true,
        "steps": [
          {
            "agent": "security_checker",
            "activityName": "checkSecurity",
            "input": {
                "idea": "{{ initialRequest.idea }}",
                "infra": "{{ terraform.output.result }}"
            }
          },
          {
            "agent": "cost_estimator",
            "activityName": "estimateCost",
            "input": {
                "idea": "{{ initialRequest.idea }}",
                "infra": "{{ terraform.output.result }}"
            }
          }
        ]
      },
      {
        "condition": "{{ security_checker.output.confidenceScore }} < 0.7 || {{ cost_estimator.output.monthlyCost }} > 10000",
        "agent": "manual_approval",
        "waitForSignal": "userApproval",
        "input": "Manual approval required"
      },
    { "agent": "summarizer", "activityName": "summarizeArchitecture", "input": {
      "idea": "{{ initialRequest.idea }}",
      "design": "{{ app_designer.output.result }}",
      "security": "{{ security_checker.output }}",
      "cost": "{{ cost_estimator.output }}"
    }}
    ]
  }
);

db.flows.insertOne({
    "_id": "insurance_opportunity:v1",
    "name": "insurance_opportunity",
    "version": "v1",
    "steps": [
      {
        "agent": "customer_profiler",
        "activityName": "profileCustomer",
        "inputKey": "initialRequest"
      },
      {
        "agent": "product_selector",
        "activityName": "matchProducts",
        "input": {
          "profile": "{{ customer_profiler.output.result }}"
        }
      },
      {
        "agent": "finance_analyzer",
        "activityName": "analyzeMargin",
        "input": {
          "product": "{{ product_selector.output.result }}",
          "customer": "{{ customer_profiler.output.result }}"
        }
      },
      {
        "agent": "regulatory_checker",
        "activityName": "verifyCompliance",
        "input": {
          "product": "{{ product_selector.output.result }}",
          "customer": "{{ customer_profiler.output.result }}"
        }
      },
      {
        "condition": "{{ finance_analyzer.output.result.margin }} < 0.15",
        "agent": "manager_approval",
        "activityName": "getApproval",
        "waitForSignal": "managerApproval",
        "input": "⚠️ Margin is low. Manual approval required."
      },
      {
        "agent": "sales_summary",
        "activityName": "createSummary",
        "input": {
          "customer": "{{ customer_profiler.output.result }}",
          "product": "{{ product_selector.output.result }}",
          "margin": "{{ finance_analyzer.output.result.margin }}"
        }
      }
    ]
  });