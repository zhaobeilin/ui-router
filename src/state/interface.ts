/** @module state */ /** for typedoc */
import {ParamDeclaration} from "../params/interface";

import {State} from "./stateObject";
import {ViewContext} from "../view/interface";
import {IInjectable} from "../common/common";
import {Transition} from "../transition/transition";
import {TransitionStateHookFn} from "../transition/interface";
import {ResolvePolicy, ResolvableLiteral} from "../resolve/interface";
import {Resolvable} from "../resolve/resolvable";

export type StateOrName = (string|StateDeclaration|State);

export interface TransitionPromise extends Promise<State> {
  transition: Transition;
}

export interface ProviderLike {
  provide: any,
  useClass?: any,
  useFactory?: Function,
  useValue?: any,
  useExisting?: any,
  deps?: any[]
}

export type ResolveTypes = Resolvable | ResolvableLiteral | ProviderLike;
/**
 * Base interface for [[Ng1ViewDeclaration]] and [[Ng2ViewDeclaration]]
 *
 * This interface defines the basic data that a normalized view declaration will have on it.
 * Framework-specific implementations may add additional fields (to their interfaces which extend this interface).
 *
 * @hidden
 */
export interface _ViewDeclaration {
  /**
   * The raw name for the view declaration, i.e., the [[StateDeclaration.views]] property name.
   * 
   * @hidden
   */
  $name?: string;

  /**
   * The normalized address for the `ui-view` which this ViewConfig targets.
   *
   * A ViewConfig targets a `ui-view` in the DOM (relative to the `uiViewContextAnchor`) which has
   * a specific name.
   * @example `header` or `$default`
   *
   * The `uiViewName` can also target a _nested view_ by providing a dot-notation address
   * @example `foo.bar` or `foo.$default.bar`
   * 
   * @hidden
   */
  $uiViewName?: string;
  
  /**
   * The normalized context anchor (state name) for the `uiViewName`
   *
   * When targeting a `ui-view`, the `uiViewName` address is anchored to a context name (state name).
   * 
   * @hidden
   */
  $uiViewContextAnchor?: string;

  /**
   * A type identifier for the View
   *
   * This is used when loading prerequisites for the view, before it enters the DOM.  Different types of views
   * may load differently (e.g., templateProvider+controllerProvider vs component class)
   *
   * @hidden
   */
  $type?: string;

  /**
   * The context that this view is declared within.
   * @hidden
   */
  $context?: ViewContext;
}

/**
 * The StateDeclaration object is used to define a state or nested state.
 * It should be registered with the [[$stateProvider]].
 *
 * @example
 * ```js
 *
 * // StateDeclaration object
 * var foldersState = {
 *   name: 'folders',
 *   url: '/folders',
 *   resolve: {
 *     allfolders: function(FolderService) {
 *       return FolderService.list();
 *     }
 *   },
 *   template: "<ul><li ng-repeat='folder in allfolders'>{{folder.name}}</li></ul>",
 *   controller: function(allfolders, $scope) {
 *     $scope.allfolders = allfolders;
 *   }
 * }
 * ```
 */
export interface StateDeclaration {
  /**
   * The state name
   *
   * A unique state name, e.g. `"home"`, `"about"`, `"contacts"`.
   * To create a parent/child state use a dot, e.g. `"about.sales"`, `"home.newest"`.
   *
   *
   * Note: States require unique names.  If you omit this property, you must provide
   * the state name when you register it with the [[$stateProvider]].
   */
  name?: string;

  /**
   * abstract state indicator
   *
   * An abstract state can never be directly activated.  Use an abstract state to provide inherited
   * properties (url, resolve, data, etc) to children states.
   */
  abstract?: boolean;

  /**
   * The parent state
   *
   * Normally, a state's parent is implied from the state's [[name]], e.g., `"parentstate.childstate"`.
   *
   * Alternatively, you can explicitly set the parent state using this property.  This allows shorter state
   * names, e.g., `<a ui-sref="childstate">Child</a>` instead of `<a ui-sref="parentstate.childstate">Child</a>
   *
   * When using this property, the state's name should not have any dots in it.
   *
   * @example
   * ```js
   *
   * var parentstate = {
   *   name: 'parentstate'
   * }
   * var childstate = {
   *   name: 'childstate',
   *   parent: 'parentstate'
   *   // or use a JS var which is the parent StateDeclaration, i.e.:
   *   // parent: parentstate
   * }
   * ```
   */
  parent?: (string|StateDeclaration);
  
  /** 
   * Gets the private API portion of the state
   * 
   * @hidden 
   */
  $$state?: () => State;

  /**
   * Resolve - a mechanism to asynchronously fetch data, participating in the Transition lifecycle
   *
   * The `resolve:` property defines data (or other dependencies) to be fetched asynchronously when the state
   * is being entered.  After the data is fetched, it can be used in views, transition hooks or other resolves
   * that belong to this state, or to any views or resolves that belong to nested states.
   *
   * ### As an array
   *
   * Each array element should either be:
   *
   * - a [[ResolvableLiteral]] object (a plain old javascript object), e.g., `{ token: 'token', resolveFn: (http) => http.get('/'), deps: [ Http ] }`
   * - a [[Resolvable]] object, e.g., `new Resolvable('token', (http) => http.get('/'), [ Http ])`
   * - an Angular 2 style [provider literal](https://angular.io/docs/ts/latest/cookbook/dependency-injection.html#!#provide), e.g.,
   *   `{ provide: 'token', useFactory: (http) => http.get('/'), deps: [ Http ] }`
   *
   * @example
   * ```js
   *
   * import {Resolvable} from "ui-router-ng2"; // or "angular-ui-router"
   * ...
   *
   * // ng2 example
   * resolve: [
   *   // If you inject `myStateDependency` into a component, you'll get "abc"
   *   { provide: 'myStateDependency', useFactory: () => 'abc' }, // ng2 style provide literal
   *   new Resolvable('myFoos', (http, trans) => http.get(`/foos/${trans.params().fooId}`), [Http, Transition])
   * ]
   * ```
   *
   * ### As an object
   *
   * - The key (string) is the name of the dependency.
   * - The value (function) is an injectable function which returns the dependency, or a promise for the dependency.
   *
   * Note: You cannot specify a policy for each Resolvable, nor can you use non-string
   * tokens when using the object style `resolve:` block.
   *
   * @example
   * ```js
   *
   * // ng1 example
   * resolve: {
   *   // If you inject `myStateDependency` into a controller, you'll get "abc"
   *   myStateDependency: function() {
   *     return "abc";
   *   },
   *   myAsyncData: ['$http', '$transition$' function($http, $transition$) {
   *     // Return a promise (async) for the data
   *     return $http.get("/foos/" + $transition$.params().foo);
   *   }]
   * }
   * ```
   *
   * ### Lifecycle
   *
   * Since a resolve function can return a promise, the router will delay entering the state until the  promises
   * are ready.  If any of the promises are rejected, the Transition is aborted with an Error.
   *
   * By default, resolves for a state are fetched just before that state is entered. Note that only states
   * which are being *entered* have their resolves fetched.  States that are "retained" do not have their resolves
   * re-fetched.  If you are currently in a parent state `A` and are transitioning to a child state `A.B`, the
   * previously resolved data for state `A` can be injected into `A.B` without delay.
   *
   * Any resolved data for `A.B` is retained until `A.B` is exited, e.g., by transitioning back to the parent state `A`.
   *
   * Because of this, resolves are a great place to fetch your application's primary data.
   *
   * ### Injecting resolves into other things
   *
   * During a transition, Resolve data can be injected into:
   * - ui-view Controllers
   * - TemplateProviders and ControllerProviders
   * - Other resolves
   *
   * ### Injecting other things into resolves
   *
   * Since resolve functions are injected, a common pattern is to inject a custom service such as `UserService`
   * and delegate to a custom service method, such as `UserService.list()`;
   *
   * #### Angular 1
   *
   * An Angular 1 resolve function can inject some special values:
   * - `$transition$`: The current [[Transition]] object; information and API about the current transition, such as
   *    "to" and "from" State Parameters and transition options.
   * - Other resolves: This resolve can depend on another resolve, either from the same state, or from any parent state.
   * - `$stateParams`: (deprecated) The parameters for the current state (Note: these parameter values are
   *
   * #### Angular 2
   *
   * An Angular 2 resolve function can inject some special values:
   * - `Transition`: The current [[Transition]] object; information and API about the current transition, such as
   *    "to" and "from" State Parameters and transition options.
   * - Other resolves: This resolve can depend on another resolve, either from the same state, or from any parent state.
   *
   * @example
   * ```js
   *
   * // Injecting a resolve into another resolve
   * resolve: [
   *   // Define a resolve 'allusers' which delegates to the UserService.list()
   *   // which returns a promise (async) for all the users
   *   { provide: 'allusers', useFactory: (UserService) => UserService.list(), deps: [UserService] },
   *
   *   // Define a resolve 'user' which depends on the allusers resolve.
   *   // This resolve function is not called until 'allusers' is ready.
   *   { provide: 'user', (allusers, trans) => _.find(allusers, trans.params().userId, deps: ['allusers', Transition] }
   * }
   * ```
   */
  resolve?: (ResolveTypes[] | { [key: string]: IInjectable; });

  /**
   * Sets the resolve policy defaults for all resolves on this state
   *
   * This should be an [[ResolvePolicy]] object. 
   * 
   * It can contain the following optional keys/values:
   * 
   * - `when`: (optional) defines when the resolve is fetched. Accepted values: "LAZY" or "EAGER"
   * - `async`: (optional) if the transition waits for the resolve. Accepted values: "WAIT", "NOWAIT", "RXWAIT"
   * 
   * See [[ResolvePolicy]] for more details.
   */
  resolvePolicy?: ResolvePolicy

  /**
   * The url fragment for the state
   *
   * A URL fragment (with optional parameters) which is used to match the browser location with this state.
   *
   * This fragment will be appended to the parent state's URL in order to build up the overall URL for this state.
   * See [[UrlMatcher]] for details on acceptable patterns.
   *
   * @examples
   * ```js
   *
   * url: "/home"
   * // Define a parameter named 'userid'
   * url: "/users/:userid"
   * // param 'bookid' has a custom regexp
   * url: "/books/{bookid:[a-zA-Z_-]}"
   * // param 'categoryid' is of type 'int'
   * url: "/books/{categoryid:int}"
   * // two parameters for this state
   * url: "/books/{publishername:string}/{categoryid:int}"
   * // Query parameters
   * url: "/messages?before&after"
   * // Query parameters of type 'date'
   * url: "/messages?{before:date}&{after:date}"
   * // Path and query parameters
   * url: "/messages/:mailboxid?{before:date}&{after:date}"
   * ```
   */
  url?: string;

  /**
   * Params configuration
   *
   * An object which optionally configures parameters declared in the url, or defines additional non-url
   * parameters. For each parameter being configured, add a [[ParamDeclaration]] keyed to the name of the parameter.
   *
   * @example
   * ```js
   *
   * params: {
   *   param1: {
   *    type: "int",
   *    array: true,
   *    value: []
   *   },
   *   param2: {
   *     value: "index"
   *   }
   * }
   * ```
   */
  params?: { [key: string]: (ParamDeclaration|any); };

  /**
   * Named views
   *
   * An optional object which defines multiple views, or explicitly targets specific named ui-views.
   *
   * - What is a view config
   * - What is a ui-view
   * - Shorthand controller/template
   * - Incompatible with ^
   *
   *  Examples:
   *
   *  Targets three named ui-views in the parent state's template
   *
   * @example
   * ```js
   *
   * views: {
   *   header: {
   *     controller: "headerCtrl",
   *     templateUrl: "header.html"
   *   }, body: {
   *     controller: "bodyCtrl",
   *     templateUrl: "body.html"
   *   }, footer: {
   *     controller: "footCtrl",
   *     templateUrl: "footer.html"
   *   }
   * }
   * ```
   *
   * @example
   * ```js
   * // Targets named ui-view="header" from ancestor state 'top''s template, and
   * // named `ui-view="body" from parent state's template.
   * views: {
   *   'header@top': {
   *     controller: "msgHeaderCtrl",
   *     templateUrl: "msgHeader.html"
   *   }, 'body': {
   *     controller: "messagesCtrl",
   *     templateUrl: "messages.html"
   *   }
   * }
   * ```
   */
  views?: { [key: string]: _ViewDeclaration; };

  /**
   * An inherited property to store state data
   *
   * This is a spot for you to store inherited state metadata.  Child states' `data` object will
   * prototypically inherit from the parent state .
   *
   * This is a good spot to put metadata such as `requiresAuth`.
   */
  data?: any;
  /**
   * A Transition Hook called with the state is being entered.  See: [[IHookRegistry.onEnter]]
   *
   * @example
   * ```js
   *
   * .state({
   *   name: 'mystate',
   *   onEnter: function(trans, state) {
   *     console.log("Entering " + state.name);
   *   }
   * });
   * ```
   *
   * Note: The above `onEnter` on the state declaration is effectively sugar for:
   * ```
   * transitionService.onEnter({ entering: 'mystate' }, function(trans, state) {
   *   console.log("Entering " + state.name);
   * });
   */
  onEnter?: TransitionStateHookFn;
  /**
   * A [[TransitionStateHook]] called with the state is being retained/kept. See: [[IHookRegistry.onRetain]]
   *
   * @example
   * ```js
   *
   * .state({
   *   name: 'mystate',
   *   onRetain: function(trans, state) {
   *     console.log(state.name + " is still active!");
   *   }
   * });
   * ```
   *
   * Note: The above `onRetain` on the state declaration is effectively sugar for:
   * ```
   * transitionService.onRetain({ retained: 'mystate' }, function(trans, state) {
   *   console.log(state.name + " is still active!");
   * });
   */
  onRetain?: TransitionStateHookFn;
  /**
   * A Transition Hook called with the state is being exited. See: [[IHookRegistry.onExit]]
   *
   * @example
   * ```js
   *
   * .state({
   *   name: 'mystate',
   *   onExit: function(trans, state) {
   *     console.log("Leaving " + state.name);
   *   }
   * });
   * ```
   *
   * Note: The above `onRetain` on the state declaration is effectively sugar for:
   * ```
   * transitionService.onExit({ exiting: 'mystate' }, function(trans, state) {
   *   console.log("Leaving " + state.name);
   * });
   */
  onExit?: TransitionStateHookFn;

  /**
   * @deprecated define individual parameters as [[ParamDeclaration.dynamic]]
   */
  reloadOnSearch?: boolean;
}

export interface HrefOptions {
  relative?:  StateOrName;
  lossy?:     boolean;
  inherit?:   boolean;
  absolute?:  boolean;
}

