---
title: "Automated Mobile App Builds/Releases with Fastlane and CircleCI"
date: 2021-05-17T12:00:00+01:00
draft: false
---

# Automated Builds & Releases

I was recently tasked with automating the iOS and Android build and releases at my work last month. We had some compliance checks coming up, and instead of making 2+ dev machines a part of the audit process, the decision was made to automate the build and release process. After doing some initial digging, I realized that there was a bit more to it than I had first thought, primarily due to the fact that the current process involved a designated individual from each team doing a manual clean build and upload, using distribution certificates that were on the local machines. While it was theoretically possible that the compliance check could audit the existing process, it would be less than ideal.


Developing the pipelines would require:

* Option to run builds on linux (Android) and macOS (iOS)
* Handling of app signing keys/certificates so developers could not create a production build on their machines
* Consider how gradle (Android) and Cocoapod (iOS) dependencies would be handled
* Uploading two app build artifacts to Google Play Store (Android) and TestFlight (iOS)
* Allowing branch-dependent flows that met each teams testing and distribution needs


