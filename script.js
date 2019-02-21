var app = angular.module('uiApplet', [
  // 'ngRoute',
  'ui.router',
  'ngSanitize',
  'components.core',
  'components.core.utils',
  'components.core.fields.input',
  'components.core.templates',
  'components.core.select',
  'components.core.dropdown',
  'components.core.modal',
  'components.core.gcModal',
  'ui.select'
]);

app.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/');
		$stateProvider
			.state('service', {
        url: '/',
        name: 'service',
        controller: 'serviceController',
				templateUrl: 'service-step.html'
			})
  		.state('description', {
        url: '/',
        name: 'description',
        controller: 'descriptionController',
				templateUrl: 'description-step.html'
			})
}]);

app.factory('jobPost', function(){
    return { 
      selectedService: { title: null }
    };
});

app.factory('steps', ['jobPost', function(jobPost){
  return { 
      service: { 
        name: 'Service',
        icon: 'draw-tool',
        done: false,
        completed: function() { 
          return jobPost.selectedService.title !== null; 
        }
      },
      description: { 
        name: 'Description',
        icon: 'cover-letter',
        done: false,
      },
      details: { 
        name: 'Details',
        icon: 'specifications',
        done: false
      },
      expertise: { name: 'Expertise', icon: 'design-creative', done: false },
      visibility: { name: 'Visibility', icon: 'recruit', done: false },
      budget: { name: 'Budget', icon: 'payment', done: false },
      review: { name: 'Review', icon: 'complete', done: false },
  };
}]);

app.controller('stepsController', ['$scope', '$state', 'jobPost', 'steps', function ($scope, $state, jobPost, steps) {
  $scope.category = null;
  $scope.jobPost = jobPost;
  $scope.steps = steps;
  $scope.isActive = function (stepIndex) {
    return $state.is(stepIndex);
  }
}]);

app.controller('descriptionController', ['$scope', '$state', 'jobPost', 'steps', 'ontology', function($scope, $state, jobPost, steps, ontology) {
  $scope.goBack = () => {
    $state.go('service')
  }
}]);

app.controller('serviceController', ['$q', '$scope', '$state', 'jobPost', 'steps', 'ontology', 'gcModal',
  function($q, $scope, $state, jobPost, steps, ontology, gcModal) {
    
    $scope.categories = ontology.categories
    $scope.selectedService = jobPost.selectedService

    $scope.toggleCategory = (category) => {
      $scope.categories.forEach((cat) => {
        if (category.title === cat.title) {
          category.isOpen = !category.isOpen
        } else {
          cat.isOpen = false
        }
      })
    }
    
    $scope.onServiceSelected = (service, category) => {
      $scope.selectedService = service
      jobPost.selectedService = service
      $scope.categories.forEach((cat) => cat.isOpen = false)
      scrollToTop(150);
    }

    $scope.isNextAvailable = () => {
      const services = $scope.categories
        .map((category) => category.services)
        .reduce((acc, curr) => acc.concat(curr), [])

      return !!services.find((service) => service.title === $scope.selectedService.title)
    }

    $scope.showServiceSerachDialog = () => {
      const deferred = $q.defer()
      const actions = {}
      
      actions.select = (service) => deferred.resolve(service)
      gcModal.open('search-service-component', { actions })
      
      deferred.promise.then((service) => {
        $scope.selectedService = service
        jobPost.selectedService = service
      })
    }
    
    $scope.cancel = function() {
      $scope.selectedService = { title: null }
      $scope.categories.forEach((category) => category.isOpen = false)
    }
    
    $scope.goNext = function() {
      $state.go('description');
    }
}]);

app.component('searchServiceComponent', {
    templateUrl: 'services-modal.html',
    controller: 'servicesModalController',
    bindings: {
      actions: '<',
    },
});

app.controller('servicesModalController', ['$sce', 'ontology', 'jobPost',  function ($sce, ontology, jobPost) {
  var vm = this;
  
  vm.categories = angular.copy(ontology.categories, [])
  vm.selectedService = Object.assign({}, jobPost.selectedService)
  vm.services = vm.categories.map((category) => category.services)
    .reduce((acc, curr) => acc.concat(curr), [])
  
  vm.comparator = (actual, expected) => {
    if (!expected) return false
    return actual.toLowerCase().includes(expected.toLowerCase())
  }
  
  vm.onCategoryClick = (category, $event) => {
    $event.preventDefault()
    category.isOpen = !category.isOpen
  }
  
  vm.highlight = (text, search) => {
    if (!search) {
        return $sce.trustAsHtml(text);
    }
    
    return $sce.trustAsHtml(
      text.replace(new RegExp(search, 'gi'), '<strong><span>$&</span></strong>')
    );
  }
  
  vm.isSelectAvailable = () => {
    return !!vm.services.find((service) => service.title === vm.selectedService.title)
  }
  
  vm.applyModal = (service) => {
    if (!service) return
    vm.actions.select(service)
    vm.close()
  }
}]);

app.filter('propsFilter', propsFilter);

function propsFilter() {
  return function(items, props) {
      var out = [];

      if (angular.isArray(items)) {
          items.forEach(function(item) {
              var itemMatches = false;

              var keys = Object.keys(props);
              for (var i = 0; i < keys.length; i++) {
                  var prop = keys[i];
                  var text = props[prop].toLowerCase();
                  if (item[prop].toString().toLowerCase().indexOf(text) !== -1) {
                      itemMatches = true;
                      break;
                  }
              }

              if (itemMatches) {
                  out.push(item);
              }
          });
      } else {
          // Let the output be the input untouched
          out = items;
      }

      return out;
  }
}

function scrollToTop(scrollDuration) {
    var scrollStep = -window.scrollY / (scrollDuration / 15),
        scrollInterval = setInterval(function(){
        if ( window.scrollY != 0 ) {
            window.scrollBy( 0, scrollStep );
        }
        else clearInterval(scrollInterval); 
    },15);
}
