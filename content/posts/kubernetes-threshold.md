---
title: "The Kubernetes Threshold"
date: 2021-01-15T08:00:00+01:00
draft: false
---

## A Single Server

Let’s imagine a small server running an application out in the wild. The
application is small--it requires only a backend server, a database, and some
static frontend code--but despite its size, the traffic on this server has been
increasing in the last few weeks.

As the traffic continues to grow, response times grow slower and users begin
complaining about the application’s slowness. Thankful that the application is
seeing increased traffic, the main developer of the application uses a late
night to increase CPU and memory on the server (a vertical scale), which
succeeds without issue.

This happens a few more times as traffic continues to grow, but soon increasing
the VM's size becomes infeasible; the developer is tired of doing the scaling in
the middle of the night and the increasing sizes provide diminishing
improvements in response time.

Tired of repeatedly increasing the size of the server, the developer explores
the idea of running multiple servers of the same application (horizontal
scaling). After discussing it with a few colleagues and reading some articles,
the developer remembers why she did the vertical scaling in the first place: the
overhead of moving towards horizontally scaled deployment seems annoying. What
should the developer do?

If you work or have worked at a company that ships products that people use,
this situation might sound familiar. A deployment process that seemed easy and
straightforward becomes toilsome and stressful, often spread across numerous
servers, creating heavy cognitive load. However, when surveying all the
alternatives for horizontal deployments, one can quickly become overwhelmed with
the array of options and tools.

So how does a single server become 2, 3, 4+ with the same initial setup? Should
one just stick a load balancer between the two instances? Does a simple
blue/green deployment with 2+ server instances get the job done? How about using
some kind of container deployment service that is triggered every time code is
merged into the main branch? What happens if one of the servers goes down?

While the example above is simplistic, it underlines the main point of this
article: deploying production-grade applications is inherently challenging. To
keep services chugging and meeting expectations, there are many things to keep
in mind.

## Production Application Non-negotiables

Deploying production-grade applications is a daunting task, and it requires
planning for (at least) the following:

* Networking (DNS, IP, certificates, load-balancing, etc.)
* Compute (the “server”)
* Scaling (vertical & horizontal)
* Persistence, Queues, & Key-Value Store
* Roles & Policies (who can do what?)
* Application Configuration & Secrets
* Logging, Alerting, & Health Checking
* Packaging, Bundling, Dependencies & Artifacts
* Deployments
* Other aspects I forgot to include...

At the end of the day, the items in the list above are production
non-negotiables. If the non-negotiables aren’t implemented or implemented
poorly, the application won’t run, will become unreachable, or will die without
any warning or insight. But the extent to which you “see” these non-negotiables
depends on where the application is deployed, and subsequently, how much you are
paying for it.

Unless you are running everything on bare metal, on Raspberry Pis in your
bedroom/garage, or “on-prem” (😱), your cloud provider likely offers a myriad of
services to get your application stood up on their machines.

And this brings us to Kubernetes. Reaching for Kubernetes begins to make sense
when faced with the cloud provider mishmash for deploying production
applications; instead of cobbling together a rag-tag group of proprietary,
cloud-based services, it might be better to harness the power of an open-source,
highly-tested, hugely-supported solution built from Google’s internal experience
of running highly available services.

Kubernetes has a million descriptions, but at its core, it is a first-class set
of objects and APIs that handle a wide range of the production deployment
non-negotiables. The fact that Kubernetes is (nearly) the whole package is one
reason that all cloud providers offer their form of Kubernetes-as-a-service.
Many cloud providers provide their version of hosted services, such as
databases, Elasticsearch, Redis, etc. but few services cover the kind of breadth
Kubernetes does.

Since Kubernetes is one of the most popular choices for deploying scaled
applications, cloud providers build their solutions to plug into the Kubernetes
API. This means that creating the same Kubernetes object in clusters on
different cloud providers often creates provider-specific resources, all while
these resources look the same on the Kubernetes cluster.

Practically speaking, let’s say you want to create a load balancer on two
clusters that exist in two different cloud providers. In the land of Kubernetes,
you might be create a [“Service”
object](https://kubernetes.io/docs/concepts/services-networking/service/) (which
allows different services to reach each other by DNS instead of IP inside the
cluster), which might subsequently create a cloud provider-specific, like an
application or network load balancer.

But the beauty here is that you are thinking in terms of Kubernetes objects--a
Service--and not in terms of AWS application load balancers or Google Cloud
Engine GKE Ingress. In the land of the clouds, change is the only constant, and
it is difficult to keep up with them. Having a frame of thinking about setup
through the lens of Kubernetes objects can be advantageous.

## When Kubernetes Might Be a Good Fit

So when should you use Kubernetes? Like everything in software, there are no
hard-and-fast rules. That said, the following might be a place to start:

**1. Your application has substantial traffic**

Kubernetes has many features for handling zero-time deployments and the
restarting of non-responsive/unhealthy services. While well-designed services
can handle substantial traffic, it can be advantageous to have full control over
how zero-downtime deployments will be rolled out.

**2. You are using a microservice architecture**

If running a microservice architecture, it’s almost guaranteed that these
services need to talk to each other. This will likely be a nightmare on
Kubernetes, but likely will be an even larger nightmare without it

**3. There are problems with your current deployment process--and there are
enough resources and will to change it**

There will always be issues with an application's deployment strategy. However,
there are times when these issues impact the business side of things. Kubernetes
will of course in no automatically solve deployment-related issues (and could
possibly even make them worse if the team has too little Kubernetes experience).
But if implemented well, Kubernetes can iron out what otherwise might have been
a toilsome deployment process.

**4. You have a considerable understanding of your application’s needs and how
it might best be deployed**

What does the application require? Which components should be deployed in the
cluster and which should be managed services? If these questions have relatively
clear answers, Kubernetes could be an appropriate choice.

**5. You want to learn about Kubernetes!**

There is no better way to learn about something by doing it, so if you're
curious about Kubernetes, get a cluster running locally and poke around.

## The Kubernetes Threshold

The list above is in no way exhaustive, and in reality, every deployed
application is its own snowflake. If you or the company already has guardrails
for deploying production applications, and there aren’t huge problems with this
existing setup, it is likely prudent to do deploy the “old” way. This assumes
that many/all of the production non-negotiables have been met, and the way they
are implemented isn’t causing business-critical issues. Sometimes it is enough
to simply set up a load balancer and deploying a second VM with an additional
instance of your application, for example.

The decision to deploy on Kubernetes, whether it’s managed or not, should not be
taken lightly. Understanding the trade-offs between the services/resources
necessary for a non-Kubernetes setup vs. those necessary for a Kubernetes setup
is paramount before rolling out a new Kubernetes cluster. The point at which it
makes “more sense” to deploy on Kubernetes is what we might call the Kubernetes
threshold.

Every situation is different, and every situation’s Kubernetes threshold will be
different. By considering this as early as possible, it will provide benefits to
people on all sides of the application. If your applications aren’t already
running on Kubernetes, imagining where your project and organizational
Kubernetes threshold lies will benefit you and your team as your work continues.
