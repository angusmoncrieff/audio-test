

export const ordinalSuffix = function (n) {
    n %= 100;
    return Math.floor(n / 10) === 1
        ? 'th'
        : (n % 10 === 1
            ? 'st'
            : (n % 10 === 2
                ? 'nd'
                : (n % 10 === 3
                    ? 'rd'
                    : 'th')));
};


export const numberOfCharsInJSX = (item) => {
    if (!item) return 0;
    else if (typeof item === 'string') return item.length;
    else if (typeof item.props.children === 'string') return item.props.children.length;
    else if (Array.isArray(item.props.children)) {
        return item.props.children.reduce((l, child) => (l + numberOfCharsInJSX(child)), 0);
    }
    else return 0;
}


export const uniqueItems = array => Array.from(new Set(array));

export const unanimousValue = array => {
    const u = uniqueItems(array);
    return u.length === 1 ? u[0] : undefined;
}

export const unanimousValueForProp = (arrayOfObjects, propName) => {
    return unanimousValue(arrayOfObjects.map(elt => elt[propName]));
}

export const rotateLeft = (array, n) => {
    let temp = array.slice();
    for (let i = 0; i < n; i++) {
        temp.push(temp.shift());
    }
    return temp;
}


export const scaleValueBetweenTwoPoints = (x1, y1, x2, y2, x) => {
    const a = (y2 - y1) / (x2 - x1);
    const b = y1 - a * x1;
    return x < x1 ? y1
        : x > x2 ? y2
            : a * x + b
        ;
}

// THESE FUNCTIONS SHOULD CORRESPOND WITH CSS MEDIA QUERIES in mediaSetup.scss!!!

export const isPhonePortrait = () => (window.matchMedia('screen and (max-width: 575px)').matches);   // bootstrap xs
export const isPhone = () => (window.matchMedia('screen and (max-width: 767px)').matches);           // bootstrap xs, sm
export const isTabletOrPhone = () => (window.matchMedia('screen and (max-width: 1200px)').matches);  // bootstrap xs, sm, md, lg
export const hasHover = () => (window.matchMedia('(hover: hover)').matches);

// export const isPhoneLandscape = () => (window.matchMedia('screen and (max-width: 767px) and (max-height: 575px)').matches);

// export const isScreen = () => (window.matchMedia('screen').matches);