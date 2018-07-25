function globalScopeInject(field, name) {
  window[name] = field;
}

export default globalScopeInject;
