#!/bin/bash
# Convenience wrapper: recording is handled inside the test via Appium's startRecordingScreen.
# This script exists so `npm run e2e:record` stays as the documented command.
set -e
cd "$(dirname "$0")/../.."
npm run e2e
