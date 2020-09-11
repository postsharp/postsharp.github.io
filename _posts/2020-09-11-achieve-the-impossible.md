---
layout: post 
comments: true
title: "How to revolutionize security, during your free time"
permalink: /post/how-to-revolutionize-security.html
author: "Simone Curzi"
published: false
excerpt_separator: <!--more-->
---
When you need to address a very urgent need, but you do not have the time to address it, adopting the right tools becomes very important. The author of this post, Simone Curzi, is a Principal Consultant from Microsoft Services, and this post introduces his story and how he has succeeded in making his vision real, in his spare time, thanks to PostSharp.
<!-- more -->
## Intro

Let me introduce myself. I am Simone Curzi, a Principal Consultant from Microsoft Services. I am an Application Security and Threat Modeling expert, and as such, I have the opportunity and privilege to help a lot of organizations to be more secure. As a former developer and architect, my style is to seek every opportunity for improvement and to do what I deem necessary to achieve my goals. On that account, I am not shy about investing my free time and resources, and I have done that two or three times in the past years.

## How the journey began

About four years ago, a group of Threat Modeling experts, which I am honored to belong to, faced a dilemma. While our experience grew, it was clear that the available tool to perform Threat Modeling was starting to show significant limits. It was focused mostly on the identification of the risks, without providing an adequate platform to identify the most relevant countermeasures and to create a proposed roadmap, which could be used by the development teams to define their remediation plans. Moreover, creating documentation was an entirely manual process, requiring a lot of work to represent the information in the most useful way, and the incorporation of even simple feedback involved a lot of effort. No, that was not an approach we could rely on for long, not if we wanted to improve and provide a better service. We continued for a while doing our job, trying to address this issue, but all the different options we tried ultimately failed. So, what to do?

At the end of 2017, I decided to try a different route. I knew what I wanted from a Threat Modeling tool; what I missed was the tool itself. At the time, my vision was a little simplistic because the old experience was still at the center of it, but I already had some goals and ideas in mind. Armed with these ideas, I started developing a tool in my spare time, which I was able to share internally in its early incarnation to some colleagues in February 2018.

The first release was little more than a design tool with specialized functions. Still, the main ideas were already there, including a sound object model based on standard terminology and essential concepts missing from the previous experience and a composable experience built as a blend of multiple functionalities that the user can select to get the tool she needs.

![](/assets/images/blog/2020-09-11-achieve-the-impossible/Threats1.jpg)
_Figure 1 – The Threats Manager Platform in action._

The experience has then evolved, including advanced reporting capabilities and functionalities to design Roadmaps to help the Development Teams to understand how to mitigate the identified risks. With the Roadmap view, it is possible to simply drag &amp; drop the identified mitigation in the respective phase of the roadmap, to see the effect on the estimated residual risk. The resulting experience is integrated and straightforward, and allows even to understand that a specific combination of activities would allow reaching an acceptable residual risk after the Mid Term phase of the roadmap, as shown by the example below.

![](/assets/images/blog/2020-09-11-achieve-the-impossible/Threats2.jpg)
_Figure 2 - The Roadmap tool and an example of mitigation planning._

From now on, the sky is the limit. Introducing advanced functionalities like the integration with Issue Tracking and Agile Planning systems like Jira and Azure DevOps is only a matter of time.

## The tools of the trade

Building Threat Manager would not have been possible, if not for selected few third-party libraries and tools. One of them was PostSharp, which I did know for having used it on some other personal projects I worked on in the past. When I started Threats Manager, PostSharp was not much for me: I did use it just for a couple of simple scenarios:

- To inject parameter validation code, using Contracts like NotNull and Required,
- to automatically verify if a class has been correctly initialized, using a custom OnMethodBoundaryAspect intercepting the method entry and exiting automatically if the object has not been initialized, yet,
- to propagate the Dirty status from the objects to the whole document, with an attribute that would allow marking the context as Dirty automatically, as soon as some property is set.

For example, the InitializationRequired Aspect would be applied to methods and properties that shall not be executed if the containing object has not been correctly initialized. It would be particularly useful, for example, if the object needs to be initialized after its creation, with a method like Initialize or Open.

```c#
[PSerializable]
[ProvideAspectRole("Initialization")]
[AspectRoleDependency(AspectDependencyAction.Order, AspectDependencyPosition.Before, StandardRoles.Validation)]
[LinesOfCodeAvoided(2)]
public class InitializationRequired : OnMethodBoundaryAspect
{
    private bool _isDefaultValueInitalized;
    private object _defaultValue;
    public InitializationRequired()
    {
        _isDefaultValueInitalized = false;
        _defaultValue = null;
    }

    public InitializationRequired(object defaultValue)
    {
        _isDefaultValueInitalized = true;
        _defaultValue = defaultValue;
    }

    public sealed override void OnEntry(MethodExecutionArgs args)
    {
        if (args.Instance is IInitializableObject initializableObject && !initializableObject.IsInitialized)
        {
            if (_isDefaultValueInitalized)
                args.ReturnValue = _defaultValue;
            args.FlowBehavior = FlowBehavior.Return;
        }
    }
}
```
_Figure 3 - The InitializationRequired Aspect to check if the object is initialized._

The class to use the InitializationRequired Aspect would, therefore, be structured as follows:

```c#
public class Link : ILink,  IInitializableObject
{
    private IDataFlow _dataFlow;
    protected IThreatModel _model { get; set; }

    public Link()
    {
    }

    public Link([NotNull] IDataFlow dataFlow) : this()
    {
        _dataFlow = dataFlow;
        _model = dataFlow.Model;
        _associatedId = _dataFlow.Id;
    }

    public bool IsInitialized => Model != null && _associatedId != Guid.Empty;
  
    private Guid _associatedId;
  
    public Guid AssociatedId => _associatedId;
  
    [InitializationRequired]
    public IDataFlow DataFlow => _dataFlow ?? (_dataFlow = _model?.GetDataFlow(_associatedId));

    [InitializationRequired]
    public ILink Clone(ILinksContainer container)
    {
        Link result = null;
        if (container is IThreatModelChild child && child.Model is IThreatModel model)
        {
            result = new Link()
            {
                _associatedId = _associatedId,
                _model = model,
                _modelId = model.Id,
            };
            this.CloneProperties(result);
            container.Add(result);
        }
        return result;
    }

    public IThreatModel Model => _model;
}
```
_Figure 4 - An example of a class using the InitializationProvider Aspect, extracted from the Threats Manager sources._

We are talking about tasks that are very easy to achieve with PostSharp, but that didn&#39;t necessarily justify the investment. Even if that was true, it was also true that I could not develop my tool during work time, but only after or before it. This project was a matter of passion, something that has not been sanctioned by Microsoft and thus a personal investment. From that point of view, the even limited value provided by PostSharp at the time was still important to me, because, with the other third-party tools I adopted, it allowed producing the first version in a few months.

Another essential advantage I have gained with PostSharp has been associated with the cleanness of the code. The adoption and enforcement of common patterns through the project makes it simple for me to maintain the solution and make changes over time. One of such examples is represented by the functionality to handle the Dirty status. Initially, my idea was to have a class aptly named Dirty, to maintain the Dirty status for the whole process. Now, I am in the process of associating the Dirty status to all classes in my object model. I&#39;m not there yet, but I may have complete the migration when you read this post. If you are curious, start from [AutoDirtyAttribute.cs](https://github.com/simonec73/threatsmanager/blob/master/Sources/ThreatsManager.Utilities/Aspects/AutoDirtyAttribute.cs), which represents the main attribute I have written to support the Dirty status. Without PostSharp, this migration would have been very involved and would have required days. With PostSharp, I&#39;ve completed it in less than four hours of work.

### More complex scenarios: the PropertiesContainerAspect

While my project grew, I found myself working again and again on the same code. For example, my object model provides an extensibility feature which allows to dynamically define and associate metadata to almost any object, as collections of Properties. When I introduced this concept, I already had several different classes to represent the Threat Model itself and its entities. Therefore I had to modify each one of them, adding the same implementation to make them containers of Properties. I knew that my approach was not the most efficient; it was even a very well documented worst practice in most development books. But what else to do? Of the various options available, nothing was ideal. I even started to think about adopting the good old C++, to use its multiple class inheritance, which would be like burning your own house because the air conditioning is defective and cannot be turn off. No, I liked my home more than I suffered for the cold.

At a certain point, I found myself adding yet another behavior, again the same code replicated to a dozen or so of classes. At this point, the approach was not manageable anymore, and I decided that I needed to do something for it.

Fortunately, I found a great option in PostSharp, which was already part of my project! After having explored some ideas, I opted to create a set of specialized aspects, each one of them implementing a specific behavior:

I now have a properties container aspect, which I apply to all the various classes that need to become containers of properties: this Aspect is a class that contains the implementation of the members of the interface, which represents in my system the container of properties.

```c#
[PSerializable]
public class PropertiesContainerAspect : InstanceLevelAspect
{
    #region Extra elements to be added.
    [IntroduceMember(OverrideAction = MemberOverrideAction.OverrideOrFail, LinesOfCodeAvoided = 1, Visibility = Visibility.Private)]
    [CopyCustomAttributes(typeof(JsonPropertyAttribute),
        OverrideAction = CustomAttributeOverrideAction.MergeReplaceProperty)]
    [JsonProperty("properties")]
    public List<IProperty> _properties { get; set; }

    [IntroduceMember(OverrideAction = MemberOverrideAction.OverrideOrFail, LinesOfCodeAvoided = 2, Visibility = Visibility.Private)]
    public void OnPropertyChanged(IProperty property)
    {
        if (property == null)
            throw new ArgumentNullException(nameof(property));
        if (Instance is IPropertiesContainer container)
            _propertyValueChanged?.Invoke(container, property);
    }
    #endregion

    #region Implementation 
    private Action<IPropertiesContainer, IProperty> _propertyAdded;
    [IntroduceMember(OverrideAction = MemberOverrideAction.OverrideOrFail, LinesOfCodeAvoided = 6)]
    public event Action<IPropertiesContainer, IProperty> PropertyAdded
    {
       add
        {
            if (_propertyAdded == null || !_propertyAdded.GetInvocationList().Contains(value))
            {
                _propertyAdded += value;
           }
      }
       remove { _propertyAdded -= value; }
    }
    private Action<IPropertiesContainer, IProperty> _propertyRemoved;
    [IntroduceMember(OverrideAction = MemberOverrideAction.OverrideOrFail, LinesOfCodeAvoided = 6)]
    public event Action<IPropertiesContainer, IProperty> PropertyRemoved
    {
        add
        {
            if (_propertyRemoved == null || !_propertyRemoved.GetInvocationList().Contains(value))
            {
                _propertyRemoved += value;
            }
        }
        remove { _propertyRemoved -= value; }
    }

    [IntroduceMember(OverrideAction = MemberOverrideAction.OverrideOrFail, LinesOfCodeAvoided = 1)]
    public IEnumerable<IProperty> Properties => _properties?.AsReadOnly();

    [IntroduceMember(OverrideAction = MemberOverrideAction.OverrideOrFail, LinesOfCodeAvoided = 3)]
    public IProperty GetProperty(IPropertyType propertyType)
    {
        if (propertyType == null)
            throw new ArgumentNullException(nameof(propertyType));
        return _properties?.FirstOrDefault(x => x.PropertyTypeId == propertyType.Id);
    }

    [IntroduceMember(OverrideAction = MemberOverrideAction.OverrideOrFail, LinesOfCodeAvoided = 20)]
    public IProperty AddProperty(IPropertyType propertyType, string value)
    {
        // Please refer to [https://github.com/simonec73/threatsmanager/blob/master/Sources/ThreatsManager.Utilities/Aspects/Engine/PropertiesContainerAspect.cs](https://github.com/simonec73/threatsmanager/blob/master/Sources/ThreatsManager.Utilities/Aspects/Engine/PropertiesContainerAspect.cs) for the actual implementation.
        return null;
    }

    [IntroduceMember(OverrideAction = MemberOverrideAction.OverrideOrFail, LinesOfCodeAvoided = 12)]
    public bool RemoveProperty(IPropertyType propertyType)
    {
        if (propertyType == null)
            throw new ArgumentNullException(nameof(propertyType));
        bool result = false;
        var property = GetProperty(propertyType);
        if (property != null)
        {
            result = _properties?.Remove(property) ?? false;
            if (result)
            {
                if (Instance is IDirty dirtyObject)
                    dirtyObject.SetDirty();
                if (Instance is IPropertiesContainer container)
                    _propertyRemoved?.Invoke(container, property);
            }
        }
        return result;
    }
    #endregion

    private IThreatModel GetModel()
    {
        IThreatModel result = null;
        if (Instance is IThreatModelChild modelChild)
            result = modelChild.Model;
        else if (Instance is IThreatModel model)
            result = model;
        return result;
    }
}
```
_Figure 5 - A simplified implementation for the PropertiesContainerAspect._

Then I have to apply the same interface to all my classes in need of being property containers, create a default implementation of the said interface, adding eventual additional placeholders required by the Aspect, and that&#39;s it!

```c#
[Serializable]
[PropertiesContainerAspect]
public class Process : IProcess
{
    public Process()
    {
    }

    #region Default implementation.
    public Guid Id { get; }
    public string Name { get; set; }
    public string Description { get; set; }
    public event Action<IPropertiesContainer, IProperty> PropertyAdded;
    public event Action<IPropertiesContainer, IProperty> PropertyRemoved;
    public IEnumerable<IProperty> Properties { get; }

    public IProperty GetProperty(IPropertyType propertyType)
    {
        return null;
    }

    public IProperty AddProperty(IPropertyType propertyType, string value)
    {
        return null;
    }

    public bool RemoveProperty(IPropertyType propertyType)
    {
        return false;
    }
    #endregion

    #region Additional placeholder required by the Aspect.
    private List<IProperty> _properties { get; set; }
    #endregion
}
```
_Figure 6 - A class using the PropertiesContainerAttribute._

Now, when I have to modify the code, I go directly to my Aspect class and perform the changes I require, instead of having to change every class implementing the interface. That&#39;s quite an improvement, in my book! The net effect has been to simplify maintenance and to allow the creation of much better code, and most importantly, the creation of a more robust solution in less time.

## Open-source license

I know now that I can rely on PostSharp to help me with my endeavor, but what I did not know, and I have recently learned, is that I can also rely on PostSharp Technologies – the makers of PostSharp – as partners in my initiative. I have recently published the core libraries of my tool and an SDK to extend it as Open Source: you can find them at [https://github.com/simonec73/threatsmanager](https://github.com/simonec73/threatsmanager). PostSharp Technologies have been so kind to provide a free license, allowing contributors of this Open Source project to use the Ultimate features having only the free Community license. Thank you again, PostSharp Technologies!

I hope that my experience can be useful for you to approach this excellent tool and get even more value out of it. I know I just scratched the surface, and I have already planned to use much more of it. And I also hope that you will like my work and will decide to contribute to it to make it even better.

Just to be clear, the Threat Modeling tool I have developed, Threats Manager Studio, is not yet available for everyone to use. For now, you are limited to the Threats Manager Platform engine and to the SDK to build its Extensions.

Feel free to use the Threats Manager Platform for creating your Threat Modeling tool, or for extending the one you own, if you are one of the few players in the space. And stay tuned: new, even better things are coming!

They said it was impossible. Now it is a reality.

That&#39;s all for now. Safe Threat Modeling to everyone!