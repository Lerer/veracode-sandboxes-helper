# veracode-sandboxes-helper
An Action to handle Sandboxes such as, deleting, promoting scans, and other


```yaml
on: workflow_dispatch

jobs:
  veracode-sandbox-task:
    runs-on: ubuntu-latest
    name: Clean 2 Sandboxes

    steps:
      - name: Hello world action step
        env:
          VERACODE_API_ID: '${{ secrets.VERACODE_API_ID }}'
          VERACODE_API_SECRET: '${{ secrets.VERACODE_API_KEY }}'
        uses: lerer/veracode-sandboxes-helper@master
        with:
          activity: 'clean'
          app-name: 'My Application'
          clean-amount: '2' # (Optional) Number - with default as 1
      
```