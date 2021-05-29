---
title: "Automated Mobile App Builds/Releases with Fastlane and CircleCI"
date: 2021-05-31T12:00:00+01:00
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
* Uploading app build artifacts to Google Play Store (Android), 
  TestFlight (iOS), and Firebase App Distribution
* Allowing branch-dependent flows that meet each teams testing and distribution
  needs

After spending some time considering these requirements for both the iOS and
Android build/release processes, I wanted the following to be true:

* Each app's build/release would not be comprised of a long bash script
* As similar build processes between apps as possible
* No unencrypted signing keys/certificates in the repo or lying around on the
  devs' machines
* Minimal manual management of signing keys/certificates
* It would still be possible to make a new production release while I was
  automating the process
* Both iOS and Android builds/releases would run in the "same place"
* No managing our own Mac instance _somewhere_ (**No Mac Minis in a random maintenance room!**)

Cursory research revealed a few different options, but there was a general
consensus regarding one of the best tools to use for designing the build and
release (among other things), and that tool is
[fastlane](https://fastlane.tools/).

## Fastlane -- an oldie but a goodie

Acquired in 2017 by Google, fastlane is an open-source project designed with a
number of actions (built in methods, essentially) and extendable plugins, that
can be used to take screenshots, build, and sign both iOS and Android
applications. While teams use fastlane for doing builds and uploads both locally
and on their build servers, neither team at my company was using it.

But I decided that using it at least for remote builds (which could then be
extended to local builds) would help me check off, or at least contribute to,
checking off some of my requirements:

* [X] Each app's build/release would not be comprised of a long bash script
* [X] As similar build processes between apps as possible
* No unencrypted signing keys/certificates in the repo or lying around on the
* Minimal manual management of signing keys/certificates
* It would still be possible to make a new production release while I was

Fastlane's builtin and plugin actions would mean that I wouldn't need to
reinvent the wheel in scripting the builds and releases for both iOS and
Android. While bash and curl share a warm place in my heart, sometimes it's
nicer to use someone else's clear, easily implementable code.

In addition, the structure of the apps' repos would also mirror each other, at
least in the additions I would be making.

## Script Signing

Both mobile apps need to be signed, and while the concept is largely the same
between platforms, the implentation differs a bit -- at least on fastlane side
of things.

For iOS, fastlane has something called [match](https://docs.fastlane.tools/actions/match/), which is a tool that works
directly with the App Store Connect API to manage your app's certificate. While
it is mostly for automatically managing your certs and profiles, it is also
possible to import currently existing certificates. Since I needed to make sure
I didn't break the current app distribution setup, the ability to keep the same
certificate was important. In addition, using a tool like match to manage certs
makes generating new ones straightforward. Finally, since there are multiple
options for storing the encrypted certs, including a private git repository, it
is possible to still share the certificates while simultaneosly handling access
to them in a granular fashion.

Since fastlane match is quite nice for handling iOS certs, how about Android
Play Store? The Play Store has a feature to "let" the Play Store manage your
app's signing key, called [Play App
Signing](https://support.google.com/googleplay/android-developer/answer/9842756?hl=en).
While this can be a good option, since it helps prevent issues related to
sharing and storing signing keys (Play Store stores the signing key and provides
an upload key, which is then used to upload the app to the Play Store), it is
not possible to move away from Play App Signing after one has opted in (new apps
are enrolled in Play App Signing by default).

In practice, this resulted in
saving an encoded upload on the environment of the build server that is used to
sign the app before uploading to the Play Store. This seemed like the best
option because there is no fastlane match equivalent for Android apps.

We needed to enroll our app into Play App Signing, but after we did this
and started using match to manage the iOS app's certs, I could check some
remaining requirements:

- [X] No unencrypted signing keys/certificates in the repo or lying around on the
  devs' machines
- [X] Minimal manual management of signing keys/certificates
- [X] It would still be possible to make a new production release while I was
  automating the process

## CircleCI

Now we come to the final component, which is running the actual builds. There are
quite a few options for CI/CD services, including ones that are targeted directly
for doing app builds. Since I was using fastlane, which is agnostic in terms of
where it needs to run I was not bound to any specific service. But since I was
on a deadline and I didn't really feel like embarking down the path of hosting
our own macOS machine, which ends up being costly, requires developer time for
patching/updates, and raises the risk for downtime. After looking over pricing,
documentation, and user experience, I decided to go with CircleCI.

CircleCI has strong support for fastlane, has good documentation for setting updates
iOS and Android builds, and has macOS machines available as run agents, I determined
I would be able to make long strides quickly. After having implemented the end-to-end
builds for our iOS and Android apps, I still feel good about choosing CircleCI.

In addition, it helped me cross off the final requirements from my list:

- [X] Both iOS and Android builds/releases would run in the "same place"
- [X] No managing our own Mac instance _somewhere_ (**No Mac Minis in a random maintenance room!**)

All in all, the process was fun to automate, and it was a good experience
using relatively mature tools to complete the job. The most annoying part was
actually determining the best strategy for app signing, and I will have more
on that aspect in a later post.
