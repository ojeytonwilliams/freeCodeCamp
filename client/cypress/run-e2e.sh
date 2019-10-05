#!/bin/bash

gastby_pid=''
api_pid=''

application_host='http://localhost:8000'
cypress_cmd='cypress:open'

finally() {
  echo "End to end bash script exiting gracefully"

  local exit_code="${1:-0}"
  # This is the clean up.
  # Find any node processes running from within the client dir
  local hanging_client_processes=$(ps aux | grep -v grep | grep client/node_modules | awk '{print $2}')
  local hanging_api_processes=$(ps aux | grep -v grep | grep api-server/node_modules | awk '{print $2}')

  # Send SIGTERM to the processes
  kill -15 $hanging_processes $hanging_api_processes $gastby_pid $api_pid &>/dev/null

  exit "${exit_code}"
}

trap finally SIGINT

run_development_application() {
  npm run stand-alone &
  gastby_pid=$!

  cd ../api-server
  npm run develop &
  api_pid=$!

  cd ../client
}

run_production_application() {
  npm run build
  npm run serve
  gastby_pid=$!

  application_host='http://localhost:9000/'
  cypress_cmd='cypress:run'
}

if [ "$NODE_ENV" = "production" ]; then
  run_production_application
else
  run_development_application
fi

while true; do
  curl $application_host &>/dev/null
  curl_exit_code=$?

  if [ $curl_exit_code = "0" ]; then
    break
  else
    sleep 10
  fi
done

npm run $cypress_cmd

finally $?
