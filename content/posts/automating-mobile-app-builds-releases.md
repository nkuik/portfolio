---
title: "Automated Mobile App Builds/Releases with Fastlane and CircleCI"
date: 2021-05-17T12:00:00+01:00
draft: false
---

# Automated Builds & Releases

I was recently tasked with automating the iOS and Android build and releases at
my work last month. We had some compliance checks coming up, and instead of
making 2+ dev machines a part of the audit process, the decision was made to
automate the build and release process.

After doing some initial digging, I realized that there was a bit more to it
than I had first thought, primarily due to the fact that the current process
involved a designated individual from each team doing a manual clean build and
upload, using distribution certificates that were on the local machines. While
it was theoretically possible that the compliance check could audit the existing
process (e.g., dev machines), it would be less than ideal.

Developing the pipelines would require:

* Option to run builds on linux (Android) and macOS (iOS)
* Handling of app signing keys/certificates so developers could not create a
  production build on their machines
* Consider how gradle (Android) and Cocoapod (iOS) dependencies would be handled
* Uploading two app build artifacts to Google Play Store (Android) and
  TestFlight (iOS)
* Allowing branch-dependent flows that met each teams testing and distribution
  needs

After spending some time considering these requirements for both the iOS and
Android build/release processes, I wanted the following to be true:

* Both iOS and Android builds/releases would run in the "same place"
* No managing our own Mac instance _somewhere_ (**turns of Mac Mini running in
  the office storage room**)
* Each app's build/release would not be comprised of a long bash script
* No unencrypted signing keys/certificates in the repo or lying around on the
  devs' machines
* Minimal manual management of signing keys/certificates
* It would still be possible to make a new production release while I was
  automating the process

Cursory research revealed a few different options, but there was a general
consensus regarding one of the best tools to use for designing the build and
release (among other things), and that tool is
[fastlane](https://fastlane.tools/).

Acquired in 2017 by Google, Fastlane is an open-source project designed with a
number of actions (built in methods, essentially) and extendable plugins, that
can be used to take screenshots, build, and sign both iOS and Android
applications. While teams use fastlane for doing builds and uploads both locally
and on their build servers, neither team at my company was using it.

But I decided that using it at least for remote builds (which could then be
extended to local builds) would help me check off, or at least contribute to,
checking off some of my requirements:

* [X] Each app's build/release would not be comprised of a long bash script
* No unencrypted signing keys/certificates in the repo or lying around on the
* Minimal manual management of signing keys/certificates
* It would still be possible to make a new production release while I was
