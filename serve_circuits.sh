#!/bin/bash

cd "$(dirname "$0")/build"
python3 -m http.server 3131
