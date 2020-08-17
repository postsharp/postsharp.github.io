---
layout: post 
comments: true
title: "Multicasting: Enhance a group of methods with just one attribute"
permalink: /post/multicasting-enhance-a-group-of-methods-with-one-attribute.html
author: "Petr H."
published: false
excerpt_separator: <!--more-->
---
Attribute multicasting, in PostSharp, is a way to apply an aspect (such as method interception) to many types or methods with just one attribute instance. It's at the core of the ability of PostSharp to reduce the number of lines of code in your project.

<!--more-->
 
In the most basic use case, you annotate a class with a method interception/method boundary attribute and it's multicast (applied) to all methods in that class, but in this blog post, we'll go over some more advanced use cases as well. 

Multicasting is included in all versions of PostSharp including the free PostSharp Community edition, and works also for community add-ins such as [ToString](https://github.com/postsharp/PostSharp.Community.ToString) and [StructuralEquality](https://github.com/postsharp/PostSharp.Community.StructuralEquality). 

## What multicasting means
Suppose _MyLog_ is [a method boundary aspect](https://blog.postsharp.net/post/add-code-before-and-after-each-method-with-postsharp-community.html) that writes to standard output at the beginning and end of each target method. It could look like this:

```c#
[Serializable]
public class MyLog : OnMethodBoundaryAspect
{
  public override void OnEntry(MethodExecutionArgs args)
  {
    Console.WriteLine("Entering");
  }
  public override void OnExit(MethodExecutionArgs args)
  {
    Console.WriteLine("Leaving");
  }
}
```

A method boundary aspect can target methods only, so if you apply it to a type, PostSharp attribute multicasting will instead cause it to apply to all methods of that type.

In the following example, if you write the code on the left, PostSharp will transform your code at build time as though you actually wrote the code on the right, but you avoided some code duplication. 

![diagram](/assets/images/blog/2020-08-17-multicasting/Diagram1.svg)

Some attributes that enhance your code work on types rather than methods or members. For example, the community add-in [ToString](https://github.com/postsharp/PostSharp.Community.ToString) applies on types and synthesizes a ToString method for them.

You can use multicasting here as well. If you apply the ToString attribute to your assembly, it will instead apply to all classes in that assembly. 

![diagram](/assets/images/blog/2020-08-17-multicasting/Diagram2.svg)

Note how properties of the add-in are copied to the actual target classes as well.

## More precise targeting

We've seen that with multicasting, attributes "cascade down" from assemblies to types to members. 

![diagram](/assets/images/blog/2020-08-17-multicasting/Diagram3.svg)

_(Whether an attribute is type level or method level is determined by MulticastAttributeUsage. You can see [documentation](https://doc.postsharp.net/multicast-conceptual) for details.)_

But it is possible to choose your targets more precisely. Each [multicast attribute](https://doc.postsharp.net/t_postsharp_extensibility_multicastattribute) has a set of properties whose names begins with Attribute, such as AttributeTargetTypes, which affect multicasting. (Almost all add-ins and all PostSharp aspects are multicast attributes.)

Here's the MulticastAttribute properties that I find the most useful:

* **AttributeTargetTypes.** The attribute is only multicast to types matching this wildcard expression or regex. 
* **AttributeTargetMembers.** The attribute is only multicast to methods matching this wildcard expression or regex. 
* **AttributeTargetTypeAttributes.** Only multicast to types which have these properties.
* **AttributeTargetMemberAttributes.** Only multicast to methods which have these properties.

I'll show this on a couple of examples:

```c#
[assembly: MyLog(
 AttributeTargetTypes = "*ViewModel", 
 AttributeTargetMemberAttributes = MulticastAttributes.Public)]
```
This means "Apply _MyLog_ to all public methods of types whose names end in _ViewModel_."

```c#
[assembly: MyLog(AttributeTargetMembers = "regex:button[0-9]+_Click")]
public class Form1 : Form { ... }
```
This means "Apply _MyLog_ to all _OnClick_ handlers on _Form1_ for buttons with default names."

## Even more precise targeting with exclusion

You can also use _AttributeExclude_ in combination with _AttributePriority_ to exclude some targets that you've previously included in multicasting. All attributes are processed in the order of _AttributePriority_ and what comes out at the end if the set of targets to which the attribute is applied.

Here's an example:

![code with exclusions](/assets/images/blog/2020-08-17-multicasting/AdvancedExample2.png)
 
For more description and details, see [our documentation](https://doc.postsharp.net/attribute-multicasting). Make sure not to accidentally use "AspectPriority" which is a different property from AttributePriority, and doesn't affect multicasting.

## Where to use multicasting
In general, multicasting is useful and safe when applying the aspect to an unintended target does not have grave impact on functionality or performance.

I find multicasting the most helpful in the following cases:

* **Logging and profiling.** In PostSharp Community, you can use PostSharp Logging for free in [Developer Mode](https://doc.postsharp.net/logging-license), and you can also write your own logging aspect ([sample](https://samples.postsharp.net/f/PostSharp.Samples.CustomLogging/)) or profiling aspect ([sample](https://samples.postsharp.net/f/PostSharp.Samples.Profiling/)). You may want to apply logging or profiling to large portions of your codebase, or — especially during debugging — to all methods in selected classes.
* **ToString.** The community add-in [ToString](https://github.com/postsharp/PostSharp.Community.ToString) is useful in many classes. You can multicast ToString to absolutely every class (it won't be applied to classes that override ToString so it's safe).
* **Security.** If you multicast an authorization aspect to all fields or methods so that some permissions are required, you are guaranteed to never forget to request a permission. With security, an opt-out approach is often safer than opt-in because applying it to an unintended field is preferable to not applying the aspect by mistake.

In some cases, not even multicasting will be precise enough for you. In those cases, you can use [aspect providers](https://doc.postsharp.net/iaspectprovider) or [compile time validation](https://doc.postsharp.net/aspect-validation). It is also possible to multicast aspects to subclasses using [multicast inheritance](https://doc.postsharp.net/multicast-inheritance).

## Conclusion

We often say that one of the benefits of PostSharp is that it saves you from writing extra repetitive lines of code.

Multicasting is one of the ways that allows you to do that, by factoring out common code and applying it at the class or assembly level.

For more examples and help with multicasting, see [our short summary on GitHub](https://github.com/postsharp/Home/blob/master/multicasting.md) or [our product documentation](https://doc.postsharp.net/attribute-multicasting). 
