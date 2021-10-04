# Veracode Sandboxes Helper
An Action to handle Sandboxes mainly as a set of clean-up activities such as:
- Deleting a sandbox
- Promoting Sandbox scan to Policy Scan 
  - with or without deleting the sandbox

## Inputs
> :exclamation: You will need to provide API credentials as environment variables. (See examples below)

### `activity`

**Required** - The name of the activity to perform

Available options value:
Value | Details
 --- | --- 
|`remove-sandbox`|Remove/Delete a sandbox|
|`promote-latest-scan`|Promote the latest Sandbox scan to a Policy|

### `app-name`
**Required** - The Veracode Application Profile name

### `sandbox-name`
**Required** - The sandbox name

### `delete-on-promote`
**Optional** - Only works with `promote-latest-scan` activity and give you the option to specify if you want the Sandbox to be deleted after the last scan is promoted to a Policy Scan


| Value |  Details|
--- | ---
|   `"false"`| **Default** - Do not delete the Sandbox |
| `"true"` | Delete the Sandbox after promoting the latest scan |

## Examples

### Delete Sandbox
For deleting a sandbox you can simply add the following step to your workflow job.

```yaml
on: 
  delete: # a trigger for when a Branch is deleted
    
  workflow_dispatch:

jobs:
  veracode-sandbox-task:
    runs-on: ubuntu-latest
    name: Clean 2 Sandboxes

    steps:

      ... # your other job steps

      - name: Delete Sandbox
        env:
          VERACODE_API_ID: '${{ secrets.VERACODE_API_ID }}'
          VERACODE_API_SECRET: '${{ secrets.VERACODE_API_SECRET }}'
        uses: lerer/veracode-sandboxes-helper@v1 
        with:
          activity: "remove-sandbox"
          app-name: "<YOUR VERACODE APPLICATION NAME>"
          sandbox-name: "<SANDBOX_NAME>" # "${{ github.ref }}"
      
```

### Promote Sandbox
For promoting a scan from Sandbox to a Policy you can use the following

```yaml
on: 
  pull_request_review: # a trigger when a Pull Request Review submitted
    types: [submitted]
        
  workflow_dispatch:

jobs:
  veracode-sandbox-task:
    runs-on: ubuntu-latest
    name: Pull Request Review Submitted

    steps:

      ... # your other job steps

      - name: Promote Scan on Approval
        # run only if the pull request got approved
        if: ${{ github.event.review.state == 'approved' }}
        env:
          VERACODE_API_ID: '${{ secrets.VERACODE_API_ID }}'
          VERACODE_API_SECRET: '${{ secrets.VERACODE_API_SECRET }}'
        uses: lerer/veracode-sandboxes-helper@v1 
        with:
          activity: "promote-latest-scan"
          app-name: "<YOUR VERACODE APPLICATION NAME>"
          sandbox-name: "<SANDBOX_NAME>" # "${{ github.event.pull_request.head.ref }}"
          delete-on-promote: true # Optional: also Deleting the Sandbox 
      
```
